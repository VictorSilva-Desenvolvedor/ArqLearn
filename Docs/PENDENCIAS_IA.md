# Pendências — IA

> Registro consolidado do que ficou em aberto sobre IA (Gemini/Groq) ao longo do desenvolvimento —
> decisões que exigem o usuário, trabalho fora de escopo de propósito, e riscos operacionais ainda sem
> mitigação. Não é um documento formal (SAD/TDD/API Spec/Database Design continuam a fonte da verdade
> pra contrato); é uma lista de trabalho, no espírito de `stitch_app_visual_identity/PENDENCIAS_TELAS.md`.
> Atualizar (e apagar item resolvido) conforme cada pendência for endereçada.

## O que já está decidido e funcionando (contexto, não pendência)

- **Gemini** (`GEMINI_API_KEY`, tier grátis, sem cartão) — geração de perguntas
  (`ai-content-pipeline/internal/geminiclient`), testado ao vivo.
- **Groq** (`GROQ_API_KEY`, tier grátis, sem cartão) — "explique melhor"
  (`monolith/internal/groqclient`, `POST /v1/lessons/{lesson_id}/questions/{question_id}/explain`), em
  produção.
- **Claude, OpenAI, DeepSeek — descartados**, todos exigem cartão/pagamento pra uso real (testado ao vivo
  pra OpenAI e DeepSeek; só pesquisa pra Claude). Chaves da OpenAI/DeepSeek removidas do `.env`.
- **Ciclo geração → revisão → publicação** fechado via CLI (`cmd/generate-questions` +
  `cmd/review-questions`) — `review_status` é filtrado de verdade em `handleStartSession`.
- **Auto-aprovação por confiança** (decisão do usuário, 08/2026): `confidence: "high"` vai direto pra
  `approved` na geração; `medium`/`low` continuam exigindo `cmd/review-questions`.
- **`cmd/review-questions` agora edita**, não só aprova/rejeita — corrige campo por campo (Enter em
  branco mantém o valor), reprova a mesma checagem de `geminiclient.Validate()` antes de salvar.
- **Modo Infinito**: decisão original (reaproveitar só o pool de `questions` `approved` por
  `tracks.topic`, sem geração dedicada) **revisada em 08/2026, a pedido do usuário** — agora o tópico
  "maquetes" (único com texto-fonte real embutido, `monolith/internal/questiongen/sourcetext`) gera um
  lote novo de 20 perguntas em segundo plano a cada 20 respondidas na sessão, persistido como Lição
  permanente (`lesson_maquetes_infinito_N`) anexada a `track_s02_maquetes` — "nível novo" quer dizer
  isso: uma lição de verdade, visível também fora do Modo Infinito. Os outros 7 temas do catálogo
  continuam exatamente como antes (só pool fixo, sem geração), porque não têm PDF-fonte carregado —
  gerar "do conhecimento geral" pra eles violaria a regra de nunca inventar sem lastro num
  texto-fonte. Trava simples em `infinite_mode_generation_state` (um doc por tópico) evita gerar dois
  lotes em paralelo. Ver API Spec §6.1 e `internal/learning/infinitemode_generation.go`.
- **Voz revisada** — `geminiclient`/`explain.go` já seguiam o tom do Persona Prompt na prática (conferido
  contra as respostas reais geradas nesta sessão), mas faltavam as regras de guardrail do §8/§9
  (direitos autorais, não forçar geração com conteúdo insuficiente) — adicionadas ao `systemPrompt` do
  `geminiclient`. Header do Persona Prompt atualizado (não referencia mais "Anthropic API").
- **Ingestão real** (08/2026, decisão do usuário: construir agora) — cobre o que estava nas pendências #1-#3
  originais. Fechado ponta a ponta e testado ao vivo em cada etapa: tabela `uploads` (Postgres,
  `migrations/0002_uploads`, FK real em `content_chunks.upload_id`); `internal/objectstorage` (R2,
  S3-compatible) nos dois módulos; `POST/GET /v1/uploads` reais no monolith; `internal/pdfextract`
  (extração pura Go, sem OCR); `geminiclient.Embed()` (1536 dim, confirmado bater com
  `content_chunks.embedding`); `internal/pgstore` gravando chunk+embedding; `cmd/ingest-file` (CLI
  ponta a ponta); `cmd/generate-questions -upload-id` gerando pergunta de RAG real, com
  `source_upload_id` preenchido de verdade (fecha a antiga pendência #3 — perguntas geradas via `-text`
  solto continuam com `source_upload_id: null`, sem plano de retrofit, o rastreamento real ali é
  `source_excerpt_ref.page`). Único elo pendente: ver pendência #1 abaixo (R2 não habilitado).

## Pendências

### 1. R2 não habilitado na conta Cloudflare — bloqueia o upload real de arquivo
A API do Cloudflare (`GET /accounts/{id}/r2/buckets`) devolve `10042: Please enable R2 through the
Cloudflare Dashboard` — confirmado que não é só a API de gerência: o próprio endpoint S3 do bucket
(`PutObject`/`GetObject`) falha com `TLS handshake failure`, testado com `curl` e com o cliente HTTP nativo
do Go (não é bug de ambiente Windows/curl). Presign de URL (`PresignUpload`) funciona normalmente porque é
cálculo local, sem round-trip — só a escrita/leitura do objeto em si depende do R2 estar habilitado. Ação
necessária: habilitar R2 no painel da Cloudflare (pode pedir cartão cadastrado mesmo pro tier grátis, sem
cobrança até passar de 10GB) e criar o bucket `arqlearn-uploads` (nome já reservado em `R2_BUCKET_NAME` no
`.env`). Depois disso, rodar `cmd/ingest-file` contra um PDF real de `Docs/ignorar/` pra fechar o teste
ponta a ponta que ficou pendente (todas as outras etapas — extração, embedding, gravação em
`content_chunks`, geração de pergunta via `-upload-id` — já foram validadas ao vivo com dados semeados
manualmente, contornando só a etapa de upload).

### 2. Política de dados do tier grátis do Gemini — decisão consciente, não bloqueante
Google pode usar input/output do tier grátis pra treinar modelo. Isso deixou de ser hipotético: com a
ingestão real (pendência #1 acima resolvida no código, só falta o R2), material do próprio usuário passa a
fluir pelo Gemini de verdade assim que um upload real for processado. Decisão: manter Gemini free tier
mesmo assim, consistente com o critério "sem cartão" que o usuário reafirmou várias vezes nesta sessão
(Vertex AI resolveria a política de dados, mas exige billing GCP). Se isso incomodar, revisitar — não é
uma decisão silenciosa, foi sinalizada explicitamente.

### 3. Sem monitoramento de quota dos tiers grátis
Gemini e Groq têm limite de requisições/tokens por dia (a pesquisa já mostrou que o Google cortou a quota
grátis em ~50-80% em dez/2025 — pode mudar de novo sem aviso). Mitigação mínima adicionada:
`cmd/generate-questions` agora reconhece erro de quota/rate-limit e imprime uma dica clara em vez de só
repassar a mensagem bruta da API. Não há alerta *antes* de estourar — só fica óbvio quando já aconteceu.
Considerar monitoramento de verdade se o volume de geração crescer a ponto de rodar sem supervisão
humana direta. **Ficou mais relevante em 08/2026**: a geração em segundo plano do Modo Infinito
(pendência resolvida acima, "Modo Infinito") roda automaticamente, sem supervisão humana, disparada só
pelo volume de uso de "maquetes" — é exatamente o cenário que este item já previa. Mitigação atual:
uma trava global por tópico (`infinite_mode_generation_state`) garante no máximo 1 lote (4 chamadas ao
Gemini) por vez, então o pior caso é 1 lote a cada ~poucos minutos de uso contínuo intenso, não 1 por
usuário simultâneo — mas ainda sem alerta proativo de quota.

### 4. Novas matérias (Docs/DocsFaculdade) — paridade de volume com Maquetes alcançada (08/2026)
Material fornecido pelo usuário em `Docs/DocsFaculdade/` (apostilas por disciplina, pasta git-ignorada
— mesmo tratamento de `Docs/ignorar/`, repo é público). Diferente de Maquetes/pendência #1, essas
perguntas foram escritas diretamente a partir do texto extraído dos PDFs (`pdftotext`), sem passar pelo
AI Content Pipeline (Gemini) — `services/monolith/seeds/003_novas_materias_licoes_perguntas.js` grava
tudo como `review_status: "pending"`, mesma regra de sempre (precisa `cmd/review-questions` ou
aprovação manual equivalente antes de virar jogável).

**Pegadinha real encontrada:** os PDFs de cada disciplina não seguem a ordem alfabética do nome do
arquivo (UUID) — cada apostila declara sua própria "Unidade N" na capa, checada página a página antes
de escrever qualquer pergunta. O primeiro PDF processado de cada disciplina acabou sendo uma unidade
diferente em cada caso (não necessariamente "Unidade 1") — não reintroduzir a suposição de que a
ordem do arquivo bate com o número da unidade.

**Feito:** 1 unidade completa (50 perguntas cada, texto integral do PDF lido, não só uma amostra) em
cada uma das 4 disciplinas — 200 perguntas no total:
- Construções Sustentáveis → **Unidade 3** (Uso dos Recursos Naturais e a Geração de Resíduos da
  Construção Civil)
- Desenho de Arquitetura e Urbanismo → **Unidade 4** (Coberturas, Elementos Verticais e
  Detalhamentos)
- Atelier de Projeto de Arquitetura Cultural → **Unidade 4** (Apresentação e detalhamento construtivo
  do anteprojeto)
- Informática Aplicada à Arquitetura e Urbanismo - Projeções Ortogonais → **Unidade 4**
  (Configurando impressão e plotagem) — a Unidade 1 dessa disciplina é PDF escaneado sem texto
  extraível, OCR não suportado nesta fase, ver pendência acima sobre PDF escaneado.

**Erro de estruturação encontrado e corrigido (08/2026):** as 4 lições foram gravadas cada uma
como 50 perguntas numa lição só. `handleStartSession` não pagina — pega todas as perguntas de
`question_ids` de uma vez numa sessão só, e nenhuma outra lição do app tem mais que ~14 perguntas.
Resultado prático: sessão de prática de 50 perguntas de uma vez, sem "próximo nó" no mapa de
aprendizado depois (só 1 unit por trilha nova). Corrigido com
`seeds/004_divide_novas_materias_em_licoes_de_10.js` — divide cada lição de 50 em 5 lições de 10
(mesma ordem), atualiza `questions.lesson_id`, recria `track.units` com 5 entries em sequência.
Rodar depois do seed 003, uma vez.

Todo `correct_answer` validado programaticamente contra as `options` (bate exatamente, sem
duplicata) antes de entrar no seed — mesma checagem que `geminiclient.Validate()` faria.

**Geração dinâmica do Modo Infinito generalizada pras 4 disciplinas (08/2026):** Maquetes tinha uma
funcionalidade que as demais trilhas não tinham — `internal/learning/infinitemode_generation.go`
gera lotes novos de perguntas via Gemini em segundo plano quando o pool do Modo Infinito de um
tópico está acabando (Docs/PENDENCIAS_IA.md #3), só pra tópicos com texto-fonte real embutido
(`questiongen.HasSourceText`). Generalizado de "hardcoded pra maquetes" pra um mapa
`generationTopicConfigs` (topic → trackID/unitID) — as 4 disciplinas novas entraram nesse mapa,
com texto-fonte real em `internal/questiongen/sourcetext/<topic>/unidade{1..4}.txt` (commitado no
repositório público, mesmo tratamento já usado pra Maquetes — decisão consciente do usuário,
08/2026, ciente de que isso expõe excertos de apostila publicamente). O texto vem do material já
extraído em `Docs/DocsFaculdade/` (1 PDF lido por inteiro + 3 com amostra de 4 trechos cada, por
disciplina — cobertura menor que Maquetes, que teve os 4 PDFs lidos por inteiro).

**QA sobre as 200 perguntas do seed 003 (08/2026):** revisão estrutural completa (correct_answer
bate exatamente com uma option, sem duplicata de option, sem prompt duplicado) não encontrou erros;
2 perguntas de Informática (Unidade 4) tinham desbalanceamento de tamanho/estrutura entre as options
("pistas" indiretas da resposta certa) — corrigidas diretamente no JSON-fonte antes da rodada
seguinte.

**Extração completa dos PDFs restantes e paridade de volume com Maquetes (08/2026):** as 2-3
unidades que faltavam de cada disciplina foram extraídas por inteiro (`pdftotext -layout`, não mais
amostra) e viraram **450 perguntas novas**, escritas com o mesmo rigor do seed 003 (rigor no
`source_ref` por página, resposta única inequívoca, validação programática de
`correct_answer`/options antes de gravar) e organizadas por unidade em
`services/monolith/seeds/005_novas_materias_unidades_extras.js`:
- Construções Sustentáveis → Unidades 1, 2 e 4 (113 perguntas; Unidade 3 já coberta pelo seed 003)
- Desenho de Arquitetura e Urbanismo → Unidades 1, 2 e 3 (113 perguntas; Unidade 4 já coberta)
- Atelier de Projeto de Arquitetura Cultural → Unidades 1, 2 e 3 (112 perguntas; Unidade 4 já coberta)
- Informática Aplicada... Projeções Ortogonais → Unidades 2 e 3, mais um lote complementar de
  reforço sobre o mesmo material (112 perguntas; Unidade 4 já coberta, Unidade 1 segue inviável —
  PDF escaneado sem texto extraível, ver abaixo)

Total por disciplina após seeds 003+005: **312-313 perguntas cada**, superando as 162 aprovadas de
Maquetes — diferença é que as de Maquetes já passaram por `cmd/review-questions` uma a uma ao longo
do tempo, enquanto estas 450 (e as 200 do seed 003) ainda estão `review_status: "pending"` até
alguém rodar a revisão manual (ou aprovação em lote consciente, como já feito uma vez nesta sessão).
O seed 005 já nasce com lições de ~10 perguntas (não repete o erro do seed 003, corrigido depois
pelo seed 004) — rodar 005 uma única vez, depois do 003; idempotente via upsert por `_id`, seguro
rodar de novo. Verificado programaticamente: nenhuma pergunta do seed 005 duplica prompt do seed 003
nem entre si.

**Ainda pendente:** PDF escaneado de Informática (Unidade 1) sem texto extraível — depende de uma
versão com texto ou de investir em OCR (fora de escopo desta fase, ver Seção 5 do
`Estrategia_Bootstrap.md`). Fora isso, as 4 disciplinas novas têm agora as 4 unidades cobertas
(Maquetes é a única com as 4 unidades + revisão humana completa via `cmd/review-questions`).
