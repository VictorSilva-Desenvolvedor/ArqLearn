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
  pra OpenAI e DeepSeek; só pesquisa pra Claude). Não retestar sem o usuário confirmar que a situação de
  billing mudou.
- **Ciclo geração → revisão → publicação** fechado via CLI (`cmd/generate-questions` +
  `cmd/review-questions`) — `review_status` agora é filtrado de verdade em `handleStartSession`.

## Pendências

### 1. Chave da OpenAI sem uso (`OPENAI_API_KEY`)
Salva em `services/monolith/.env`, mas nunca usada em código. Testada ao vivo: autentica, geração falha
por `429 insufficient_quota` (sem crédito). Duas saídas possíveis: (a) o usuário adiciona pagamento na
conta OpenAI e revisita a decisão, ou (b) apaga a chave do `.env` e do dashboard da OpenAI, encerrando o
assunto. Nenhuma das duas foi feita ainda.

### 2. Coleção `uploads` nunca foi desenhada
`Database_Design.md` não tem schema pra ela — só existe como tipo de resposta (`UploadedContent`, API
Spec §3.4). Bloqueia: ingestão real de arquivo (S3, presigned URL), os endpoints de revisão documentados
(`GET/PATCH /v1/uploads/{upload_id}/questions`, API Spec §7 — hoje stub), e a tela de revisão do
`apps/web` (`(teacher)/revisao`, hoje mock) ficar conectada a dados reais. Desenhar esse schema é
pré-requisito de qualquer um dos itens 3-5 abaixo.

### 3. Estágios 1-3 do AI Content Pipeline continuam stub
`normalize`, `extract`, `structureRAG` (`internal/pipeline/pipeline.go`) não fazem nada — sem eles não há
extração real de PDF/vídeo nem chunking automático em `content_chunks` (pgvector — a tabela já existe na
migration aplicada, mas nada escreve nela). Hoje o texto-fonte é colado à mão em cada chamada de
`generate-questions`. Ordem de esforço, se/quando for hora: OCR (Tesseract, self-hosted, já decidido em
`Estrategia_Bootstrap.md` §4) → chunking + embeddings → wiring do estágio 4 real (já existe:
`geminiclient.GenerateQuestions`) no fluxo de evento em vez de só no CLI solto.

### 4. `cmd/review-questions` não tem ação de editar
Só aprova ou rejeita. Pra corrigir um problema pontual (ex.: o bug real de `correct_answer` já
encontrado), a via hoje é regenerar a pergunta ou editar direto no Mongo. Volume atual (poucas perguntas
por lote) não justificou construir edição interativa — reavaliar se o volume crescer.

### 5. Sem gatilho de auto-aprovação por confiança
Toda pergunta gerada vira `pending`, mesmo com `confidence: "high"` — nunca foi decidido se perguntas de
alta confiança deveriam poder pular revisão humana (o Persona Prompt só exige revisão obrigatória pra
`low`, não proíbe auto-publicar `high`/`medium`). Ficou deliberadamente conservador por ora (banco de
questões é o ativo mais importante do produto); só afrouxar essa regra com decisão explícita do usuário.

### 6. Resumo Inteligente (§6.2) e Chat sobre Material (§6.3) continuam 100% stub
Nenhum dos dois foi conectado a Gemini ou Groq ainda. Resumo Inteligente tem cara de tarefa do Gemini
(extração estruturada de material, mesmo perfil de "baixo volume, alta fidelidade" da geração de
pergunta). Chat sobre Material é mais parecido com "explique melhor" no formato de interação, mas precisa
de RAG de verdade (item 3) pra não violar a regra de nunca alucinar resposta fora do material — não dá
pra fazer uma versão "só de mentirinha" sem quebrar essa regra do Persona Prompt.

### 7. Modo Infinito — de onde vêm as perguntas?
Ainda stub. Não decidido se reaproveita o mesmo pool de perguntas `approved` já existente (por trilha/
tópico) ou se precisa de geração dedicada.

### 8. Sem monitoramento de quota dos tiers grátis
Gemini e Groq têm limite de requisições/tokens por dia (a pesquisa já mostrou que o Google cortou a quota
grátis em ~50-80% em dez/2025 — pode mudar de novo sem aviso). Nada no projeto alerta quando isso está
perto de estourar; hoje só se descobre quando uma chamada começa a falhar. Considerar um alarme simples
quando o volume de geração/revisão crescer.

### 9. Política de dados do tier grátis do Gemini não foi endereçada
Google pode usar input/output do tier grátis pra treinar modelo. Não é um problema hoje (texto colado à
mão, sem material sensível de usuário passando por lá), mas vira relevante assim que a ingestão real
(item 3) processar upload de material do próprio usuário. Vertex AI resolve isso mas deixa de ser
gratuito — decisão a reavaliar nesse momento, não antes.

### 10. `source_upload_id` sempre `null`
Toda pergunta gerada hoje não tem upload de origem real (não existe upload real, ver item 2) — o campo
fica `null` permanentemente. Se a coleção `uploads` for desenhada no futuro, as perguntas já publicadas
via CLI ficam "órfãs" desse vínculo; não há plano de retrofit, é aceitável deixar assim (o rastreamento
real está em `source_excerpt_ref.page`, que sempre existe).

### 11. Vozes de Gemini/Groq nunca foram comparadas com a calibração do Persona Prompt
O texto do `ArqLearn_IA_Persona_System_Prompt.md` foi escrito pensando em Claude (documento original,
ainda referenciado como "cole isto na Anthropic API" — não atualizado pra citar os provedores atuais).
Gemini e Groq recebem só um recorte das regras operativas (ver `systemPrompt` em `geminiclient.go` e
`explainSystemPrompt` em `explain.go`), não o documento inteiro, e ninguém revisou sistematicamente se o
tom/qualidade bate com a intenção original — só foi conferido pontualmente nos testes ao vivo feitos
durante a implementação. Vale uma checagem mais completa quando houver volume real de uso.
