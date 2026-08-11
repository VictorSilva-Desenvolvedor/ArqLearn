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
