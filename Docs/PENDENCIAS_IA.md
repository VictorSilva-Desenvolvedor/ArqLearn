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
- **Modo Infinito**: decidido reaproveitar o pool de `questions` `approved` por `tracks.topic`, sem
  geração dedicada (API Spec §6.1).
- **Voz revisada** — `geminiclient`/`explain.go` já seguiam o tom do Persona Prompt na prática (conferido
  contra as respostas reais geradas nesta sessão), mas faltavam as regras de guardrail do §8/§9
  (direitos autorais, não forçar geração com conteúdo insuficiente) — adicionadas ao `systemPrompt` do
  `geminiclient`. Header do Persona Prompt atualizado (não referencia mais "Anthropic API").

## Pendências

### 1. Ingestão real — EM ANDAMENTO
Decisão do usuário (08/2026): construir agora, não adiar mais. Cobre o que estava nas pendências #2 e #3
originais (schema de `uploads`, S3/R2, OCR Tesseract, chunking/embeddings em `content_chunks`) — sendo
planejado como próximo passo desta mesma conversa (plan mode).

### 2. Política de dados do tier grátis do Gemini — decisão consciente, não bloqueante
Google pode usar input/output do tier grátis pra treinar modelo. Isso deixou de ser hipotético: com a
ingestão real (item 1), material do próprio usuário passa a fluir pelo Gemini de verdade. Decisão: manter
Gemini free tier mesmo assim, consistente com o critério "sem cartão" que o usuário reafirmou várias
vezes nesta sessão (Vertex AI resolveria a política de dados, mas exige billing GCP). Se isso incomodar,
revisitar — não é uma decisão silenciosa, foi sinalizada explicitamente.

### 3. `source_upload_id` — deixa de ser sempre `null` quando a ingestão real existir
Antes era "aceitável deixar `null` pra sempre"; com a ingestão real entrando em construção, perguntas
geradas a partir de um upload de verdade devem carregar o `upload_id` real. Perguntas já publicadas via
CLI solto (sem upload) continuam com `null` — não há plano de retrofit pra elas, e está tudo bem, o
rastreamento real está em `source_excerpt_ref.page`.

### 4. Sem monitoramento de quota dos tiers grátis
Gemini e Groq têm limite de requisições/tokens por dia (a pesquisa já mostrou que o Google cortou a quota
grátis em ~50-80% em dez/2025 — pode mudar de novo sem aviso). Mitigação mínima adicionada:
`cmd/generate-questions` agora reconhece erro de quota/rate-limit e imprime uma dica clara em vez de só
repassar a mensagem bruta da API. Não há alerta *antes* de estourar — só fica óbvio quando já aconteceu.
Considerar monitoramento de verdade se o volume de geração crescer a ponto de rodar sem supervisão
humana direta.
