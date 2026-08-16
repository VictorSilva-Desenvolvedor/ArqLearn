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

### 4. Novas matérias (Docs/DocsFaculdade) — 1 unidade de 4 disciplinas coberta a fundo, resto pendente
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

**Pendente:** as 2-3 unidades restantes de cada uma dessas 4 disciplinas (cada uma tem 4
PDFs/apostilas no total, 30-116 páginas cada) — o texto de amostra dos PDFs não usados ainda está
organizado em `Docs/DocsFaculdade/<disciplina>/chunks/`, com o script
`Docs/DocsFaculdade/GERAR_PERGUNTAS.sh` pronto pra rodar via `cmd/generate-questions` (Gemini) +
`cmd/review-questions` quando for a vez de completar — **mas esse script ainda usa a numeração de
unidade antiga (por ordem alfabética de arquivo), errada; confirmar o número real de cada PDF (ver
pegadinha acima) antes de rodá-lo.** Nenhuma ação foi tomada ainda sobre o PDF escaneado
(Informática, Unidade 1) — depende de uma versão com texto ou de investir em OCR (fora de escopo
desta fase, ver Seção 5 do `Estrategia_Bootstrap.md`).

**Nota (13/08/2026) — `Docs/DocsFaculdade/` não existe fora da máquina original.** É pasta
git-ignored (`.gitignore` linha 28, mesmo tratamento de `Docs/ignorar/`) — em qualquer ambiente
que seja só um clone do repositório (sandbox, outra máquina, CI), essa pasta e o script
`GERAR_PERGUNTAS.sh` genuinamente não existem. O único material acessível fora da máquina original
é o que já foi commitado em `services/monolith/internal/questiongen/sourcetext/<disciplina>/
unidade{1..4}.txt` (usado pela geração dinâmica do Modo Infinito) — só que **esses arquivos têm o
mesmo problema de numeração da pegadinha acima**: só o `unidade1.txt` de cada disciplina (o PDF
lido por inteiro, que é a unidade já publicada) se auto-declara ("Unidade N" no início do texto);
os outros 3 arquivos por disciplina (as amostras) raramente têm essa declaração no trecho
extraído — confirmado que só 1 dos 12 arquivos-amostra (`informatica_projecoes_ortogonais/
unidade2.txt`, que contém literalmente "o início da Unidade 2") permite confirmar o número real
sem acesso ao PDF original. Tentativa de gerar mesmo assim pra esse 1 caso confirmado
(`cmd/generate-questions -count=1`, teste): a geração via Gemini funcionou (pergunta passou na
validação estrutural), mas a gravação falhou — MongoDB Atlas com credencial inválida nesta sessão
(ver memória do projeto, mesmo bloqueio que afeta a Fase 1 do app mobile). Ou seja, mesmo o único
caso resolvível sem o PDF original está bloqueado por infra até a credencial do Atlas ser
corrigida. Retomar isso precisa de dois pré-requisitos: (1) MongoDB Atlas acessível, e (2) rodar
na máquina com `Docs/DocsFaculdade/` de verdade (ou o usuário confirmando manualmente o número
real de cada arquivo-amostra restante).

**[RESOLVIDO 16/08/2026] Paridade de quantidade de perguntas por página, entre Maquetes e as 4
disciplinas novas.** Usuário pediu pra conferir se todas as "páginas" (as lições `_p1..pN` da
divisão de `seeds/004`) têm a mesma quantidade de perguntas e, se não, igualar. Auditoria via
`mongosh` direto no banco real (contando por `lessons.question_ids.length`, não por
`questions.lesson_id` — esse campo está desatualizado pras 12 lições `_p2/_p3/_p4` de Maquetes,
armadilha real encontrada durante a checagem) revelou: as 4 disciplinas novas (20 páginas) já
batiam certinho em 10 cada (`CHUNK_SIZE=10` do seed 004); só Maquetes (16 páginas) destoava,
variando 9–11.

Perguntado ao usuário se a meta era "todas em 10" (bate com o padrão já estabelecido, mas exige
remover 5 perguntas já aprovadas de 2 páginas de Maquetes) ou "todas em 11" (só adicionar, sem
remover nada). **Duas tentativas de remoção direta via `mongosh`/`$pull` foram bloqueadas pelo
classificador de permissão do Claude Code** (escrita bruta em banco de produção fora do fluxo
normal da aplicação) — em vez de contornar, a decisão foi levada ao usuário, que confirmou:
sempre igualar pra cima, nunca remover. Resultado: as 20 páginas das 4 disciplinas novas também
subiram de 10 pra 11, pra manter as 36 páginas do sistema (todas as 5 trilhas populadas)
uniformes em 11.

**34 perguntas novas geradas** via `cmd/generate-questions` (Gemini, texto-fonte real de
`internal/questiongen/sourcetext/<disciplina>/unidade{N}.txt`, mesmo arquivo já usado pela
lição-mãe de cada página — 31 chamadas, uma por página que precisava de reforço, algumas com
`-count=2` quando faltava mais de 1): 14 em Maquetes (Unidades 1, 2 e 3) + 20 nas 4 disciplinas
novas (5 páginas × 4, todas as unidades já publicadas). **100% de aproveitamento** — todas as 34
passaram na validação estrutural e vieram com `confidence: "high"` (auto-aprovadas, sem passar por
`cmd/review-questions`). Verificado ao vivo depois: as 36 páginas do sistema (16 de Maquetes + 20
das 4 disciplinas novas) têm exatamente 11 perguntas `approved` cada, confirmado via `mongosh`
contando por `question_ids` + `review_status`.

Nenhuma mudança de código — só conteúdo (perguntas novas no MongoDB). Sem PR/commit associado.
