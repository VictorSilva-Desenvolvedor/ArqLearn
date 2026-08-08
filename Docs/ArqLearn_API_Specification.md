# API SPECIFICATION
## ArqLearn

Especificação de referência dos endpoints REST expostos pelo API Gateway.

Versão 1.5 | Agosto de 2026
Documento complementar ao SAD e ao TDD do ArqLearn v1.0

> **Sobre esta versão:** versão em Markdown, mantida como fonte da verdade a partir de agora (ver
> `CLAUDE.md`). O arquivo `ArqLearn_API_Specification.docx` original (v1.0) permanece na pasta como
> snapshot histórico, mas não é mais atualizado.

### Controle de Versão

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 08/08/2026 | Equipe de Engenharia | Versão inicial da especificação de API |
| 1.1 | 08/08/2026 | Equipe de Engenharia | Novos endpoints: Modo Infinito, Resumo Inteligente, Chat sobre material |
| 1.2 | 08/08/2026 | Equipe de Engenharia | Expõe limite diário de XP no `GamificationProfile` e nas respostas de resposta de exercício; primeira versão consolidada em Markdown |
| 1.3 | 08/08/2026 | Equipe de Engenharia | Remove Auth Service próprio — registro/login/refresh/OAuth passam a ser Supabase Auth direto do cliente; toda rota desta API agora exige token Supabase válido |
| 1.4 | 08/08/2026 | Equipe de Engenharia | Adiciona `LESSON_NOT_FOUND`, encontrado ao implementar `POST /v1/lessons/{lesson_id}/session` e `/answers` |
| 1.5 | 08/08/2026 | Equipe de Engenharia | `question.options` passa a `{id, label}[]` (id estável, não texto) e `answer` passa a ser esse id; `lesson.order` adicionado — os três encontrados ao integrar com o app web já em construção |

---

## 1. Introdução

Este documento especifica formalmente a API REST do ArqLearn, consumida pelos aplicativos mobile, web e
pelo painel do professor. Ele detalha rotas, parâmetros, corpos de requisição/resposta, códigos de status
e erros, servindo de contrato entre backend e clientes. As regras de negócio por trás de cada endpoint
estão descritas no `ArqLearn_TDD_Technical_Design_Document.md`; este documento foca no contrato de
interface.

## 2. Convenções Gerais

### 2.1 Base URL e Versionamento

```
Produção:  https://api.arqlearn.com/v1
Staging:   https://api.staging.arqlearn.com/v1
```

A API é versionada por prefixo de path (`/v1`). Mudanças que quebram compatibilidade geram uma nova
versão (`/v2`); mudanças aditivas (novos campos opcionais) não incrementam versão.

### 2.2 Autenticação

Todas as rotas, exceto as explicitamente marcadas como públicas, exigem um access token JWT no cabeçalho
`Authorization`. A partir da v1.3, esse token é **emitido pelo Supabase Auth** (não por nós) — ver §4
para o fluxo completo. O backend valida o token a cada requisição (assinatura + expiração) e extrai o
`user_id` do claim `sub`; nunca aceitar um `user_id` vindo de outro lugar (body, query param) como fonte
de verdade de identidade.

```
Authorization: Bearer <access_token>
```

### 2.3 Formato de Erro Padrão

```json
{
  "error_code": "LESSON_NO_HEARTS_LEFT",
  "message": "Você não possui vidas suficientes para continuar.",
  "trace_id": "a1b2c3d4-...",
  "details": {}
}
```

### 2.4 Paginação

Endpoints de listagem usam paginação por cursor via query params `limit` (padrão 20, máximo 100) e
`cursor`. A resposta inclui um envelope com `next_cursor`.

```
GET /v1/tracks?limit=20&cursor=eyJvZmZzZXQiOjIwfQ

{
  "data": [ ... ],
  "next_cursor": "eyJvZmZzZXQiOjQwfQ" | null
}
```

### 2.5 Rate Limiting

Limite padrão de 120 requisições por minuto por usuário autenticado. A partir da v1.3, toda rota desta
API exige autenticação (§4) — não há mais rota pública aqui; rate limiting de registro/login/OAuth é
responsabilidade do Supabase Auth, fora desta API. Excedentes retornam `429 Too Many Requests` com
cabeçalho `Retry-After`.

### 2.6 Idempotência

Operações POST sensíveis a duplicação (ex.: compra na loja, confirmação de upload) aceitam o cabeçalho
`Idempotency-Key`; requisições repetidas com a mesma chave em até 24h retornam a resposta original sem
reprocessar.

## 3. Modelos de Dados Comuns

### 3.1 User

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador único do usuário. |
| `name` | string | Nome de exibição. |
| `email` | string | E-mail, único no sistema. |
| `role` | enum | `student` \| `teacher` \| `admin`. |
| `timezone` | string | Fuso IANA, ex.: `America/Sao_Paulo`. |
| `created_at` | datetime | Data de criação da conta, ISO-8601 UTC. |

### 3.2 GamificationProfile

| Campo | Tipo | Descrição |
|---|---|---|
| `xp_total` | integer | XP acumulado histórico. |
| `xp_today` | integer | XP ganho no dia local do usuário, sujeito ao limite diário (ver TDD §3.2). Reseta à meia-noite local. *(v1.2)* |
| `level` | integer | Nível calculado a partir do `xp_total`. |
| `streak_current` | integer | Sequência atual de dias consecutivos. |
| `streak_best` | integer | Recorde pessoal de streak. |
| `hearts_current` | integer | Vidas disponíveis (0–5). |
| `gems` | integer | Moeda virtual acumulada. |
| `league_tier` | integer | Tier da liga semanal atual. |

### 3.3 Track / Lesson / Question

| Campo | Tipo | Descrição |
|---|---|---|
| `track.id` | string | Identificador da trilha. |
| `track.origin` | enum | `curated` \| `user_generated`. |
| `lesson.id` | string | Identificador da lição. |
| `lesson.order` | integer | Posição da lição dentro da trilha (1-based), derivada de `track.units[].lesson_ids` — não é um campo salvo em `lessons`, é calculado a cada resposta. *(v1.5)* |
| `question.type` | enum | `multiple_choice` \| `true_false` \| `matching` \| `fill_blank` \| `image_identification`. |
| `question.difficulty` | enum | `easy` \| `medium` \| `hard`. |
| `question.review_status` | enum | `pending` \| `approved` \| `rejected` \| `edited`. |
| `question.options[].id` | string | Id estável da opção, derivado da posição ("a", "b", "c"...) — **não** é o texto da opção. `answer` em `POST /v1/lessons/{lesson_id}/answers` é este id, não o texto. *(v1.5)* |

### 3.4 UploadedContent

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador do upload. |
| `file_type` | enum | `pdf` \| `docx` \| `pptx` \| `image` \| `video`. |
| `status` | enum | `received` \| `processing` \| `ready_for_review` \| `published` \| `failed`. |
| `size_bytes` | integer | Tamanho do arquivo em bytes (máx. 2 GB). |

## 4. Autenticação (Supabase Auth)

> **v1.3 — mudança de arquitetura.** Registro, login, refresh e OAuth **não são mais endpoints desta
> API**. `apps/web` e `apps/mobile` chamam o Supabase Auth diretamente (SDK oficial, endpoint
> `{SUPABASE_URL}/auth/v1/...`) — nosso backend nunca vê senha nem emite token. Isso reduz superfície de
> segurança própria (sem hashing, sem rotation de refresh token pra manter) às custas de um provedor a
> mais no caminho crítico do app. Ver `ArqLearn_Documento_Arquitetura_Software.md` §8.2 e
> `ArqLearn_Database_Design.md` §3.2 (trigger `on_auth_user_created`) para o resto da decisão.

Fluxo do cliente:
1. `apps/web`/`apps/mobile` chamam o Supabase Auth diretamente para cadastro, login e OAuth (Google/
   Apple) — nunca através desta API.
2. O Supabase Auth cria a linha em `auth.users` e o trigger do banco cria automaticamente o perfil em
   `users`/`user_gamification` — o cliente não precisa chamar nenhum endpoint nosso para "criar perfil".
3. Todas as chamadas subsequentes a esta API usam o **JWT emitido pelo Supabase** no cabeçalho
   `Authorization: Bearer <token>` (ver §2.2) — o backend valida esse token a cada requisição, nunca
   confia em um `user_id` enviado pelo cliente.

Os antigos `error_code` `EMAIL_ALREADY_EXISTS`, `AUTH_INVALID_CREDENTIALS` e
`AUTH_REFRESH_TOKEN_INVALID` saem do catálogo desta API (§12) — esses erros agora vêm do Supabase Auth
diretamente na resposta que o cliente já recebeu ao chamá-lo, não desta API.

## 5. Users Service

**`GET /v1/users/me`** — Retorna o perfil completo do usuário autenticado, incluindo o
`GamificationProfile` embutido.

```json
// Response 200
{ "user": { "...User" }, "gamification": { "...GamificationProfile" } }
```

**`PATCH /v1/users/me`** — Atualiza preferências do usuário. Todos os campos são opcionais.

```json
// Request body
{ "name"?: "string", "timezone"?: "string", "notifications_enabled"?: boolean }
// Response 200
{ "...User" }
```

**`DELETE /v1/users/me`** — Solicita exclusão de conta (LGPD). Inicia processo assíncrono de
anonimização/expurgo, retornando 202.

```json
// Response 202
{ "deletion_scheduled_at": "datetime" }
```

## 6. Learning Service

**`GET /v1/tracks`** — Lista trilhas disponíveis. Suporta filtro por `topic` e `origin`.

```
Query: ?topic=urbanismo&origin=curated&limit=20&cursor=...
Response 200: { "data": [ {"...Track"} ], "next_cursor": "string|null" }
```

**`GET /v1/tracks/{track_id}/lessons`** — Lista as lições de uma trilha, com o progresso do usuário
autenticado embutido em cada item.

```json
// Response 200
{
  "data": [
    { "lesson": { "...Lesson" }, "progress_status": "not_started"|"in_progress"|"completed" }
  ]
}
```
Erros: `404 TRACK_NOT_FOUND`

**`POST /v1/lessons/{lesson_id}/session`** — Inicia uma sessão de prática. O servidor monta a fila de
perguntas priorizando itens vencidos no SRS.

```json
// Response 201
{
  "session_id": "uuid",
  "questions": [
    {
      "...Question",
      "options": [ { "id": "a", "label": "string" }, { "id": "b", "label": "string" } ]
    }
  ],
  "hearts_available": 5
}
```
Erros: `404 LESSON_NOT_FOUND` · `409 LESSON_NO_HEARTS_LEFT`

*(`LESSON_NOT_FOUND` adicionado na v1.4 — o erro de vidas insuficientes já estava documentado desde a
v1.0, mas nunca havia um código para "a lição em si não existe", encontrado ao implementar este
endpoint. Formato `options[].{id,label}` fechado na v1.5 — ver nota abaixo.)*

**`POST /v1/lessons/{lesson_id}/answers`** — Submete a resposta de uma pergunta dentro de uma sessão
ativa.

```json
// Request body
{ "session_id": "uuid", "question_id": "uuid", "answer": "string (id da opção, ex.: \"b\" — não o texto)", "time_ms": integer }

// Response 200
{
  "correct": boolean,
  "xp_ganho": integer,
  "xp_daily_cap_reached": boolean,
  "vidas_restantes": integer,
  "streak_atual": integer,
  "explicacao": "string"
}
```
`xp_ganho` já vem líquido do limite diário de XP (TDD §3.2) — quando `xp_daily_cap_reached` é `true`,
`xp_ganho` pode ser `0` mesmo com `correct: true`. *(campo `xp_daily_cap_reached` adicionado na v1.2)*

> **v1.5 — `answer` é id, não texto.** O corpo aceita o `id` da opção escolhida (ex.: `"b"`), não o
> texto da resposta. Decisão tomada ao integrar com o app: comparar texto literal é frágil (acento,
> maiúscula/minúscula, normalização Unicode — ver `Docs/CLAUDE.md` para um caso real de falso-negativo
> encontrado por causa disso) e obriga o cliente a conhecer o texto exato da resposta certa antes de o
> usuário responder, quando só precisa saber qual opção ele tocou. O texto de cada opção continua
> guardado como string simples em `questions.options` (Database Design §4.3) — o id é derivado da
> posição só na hora de montar a resposta da API, nunca persistido.

Erros: `404 SESSION_NOT_FOUND` · `410 SESSION_EXPIRED`

**`GET /v1/progress/summary`** — Resumo agregado de progresso do usuário, usado no dashboard pessoal e
como base para o painel do professor.

```json
// Response 200
{
  "tracks_in_progress": integer,
  "tracks_completed": integer,
  "lessons_completed_last_7d": integer,
  "accuracy_rate": number
}
```

### 6.1 Modo Infinito *(v1.1)*

**`POST /v1/infinite-mode/sessions`** — Inicia uma sessão de Modo Infinito para um tópico.

```json
// Request body
{ "topic": "string" }

// Response 201
{
  "session_id": "uuid",
  "topic": "estruturas",
  "question": { "...Question", "options": ["..."] }
}
```

**`POST /v1/infinite-mode/sessions/{session_id}/answers`** — Submete a resposta atual e retorna a
próxima questão do modo infinito.

```json
// Request body
{ "question_id": "uuid", "answer": "string", "time_ms": integer }

// Response 200
{
  "correct": boolean,
  "xp_ganho": integer,
  "xp_daily_cap_reached": boolean,
  "questions_answered": integer,
  "correct_count": integer,
  "next_question": { "...Question" }
}
```
`next_question` ausente quando o banco de perguntas do tópico se esgota — cliente deve tratar como fim
de sessão nesse caso. Campo `xp_daily_cap_reached` adicionado na v1.2, mesmo comportamento de §6.

**`POST /v1/infinite-mode/sessions/{session_id}/end`** — Encerra a sessão manualmente (botão "Desistir"
na UX) e retorna o resumo final.

```json
// Response 200
{
  "questions_answered": integer,
  "correct_count": integer,
  "accuracy_rate": number,
  "xp_earned": integer,
  "avg_time_ms": integer
}
```
Erros: `404 SESSION_NOT_FOUND`

### 6.2 Resumo Inteligente *(v1.1)*

**`GET /v1/uploads/{upload_id}/summary`** — Retorna o resumo estruturado gerado por IA para o upload.
Gera sob demanda na primeira chamada se ainda não existir (processamento síncrono só é aceitável se o
upload já estiver `ready_for_review`/`published` — caso contrário retorna 409).

```json
// Response 200
{
  "upload_id": "uuid",
  "title": "string",
  "synopsis": "string",
  "key_points": [ { "title": "string", "explanation": "string" } ],
  "architect_tip": "string | null",
  "generated_at": "datetime"
}
```
Erros: `404 UPLOAD_NOT_FOUND` · `409 UPLOAD_NOT_READY`

### 6.3 Chat sobre Material *(v1.1)*

**`POST /v1/uploads/{upload_id}/chat`** — Envia uma pergunta em linguagem natural sobre o material.
Resposta ancorada por RAG ao conteúdo do próprio upload.

```json
// Request body
{ "message": "string" }

// Response 200
{
  "message_id": "uuid",
  "answer": "string",
  "source_excerpt": "string",
  "source_ref": { "page": 0, "timestamp_ms": 0 },
  "created_at": "datetime"
}
```
Erros: `404 UPLOAD_NOT_FOUND` · `409 UPLOAD_NOT_READY` · `422 QUESTION_OUT_OF_SCOPE`

**`GET /v1/uploads/{upload_id}/chat`** — Lista o histórico de mensagens da thread do usuário autenticado
para aquele upload (paginado, ver §2.4).

```json
// Response 200
{ "data": [ { "message_id", "role": "user|assistant", "message", "created_at" } ], "next_cursor": "string | null" }
```

## 7. Ingestion Service

**`POST /v1/uploads`** — Inicia um upload. Retorna uma URL pré-assinada para envio direto ao object
storage (S3), evitando proxy do binário pela API.

```json
// Request body
{ "filename": "string", "content_type": "string", "size_bytes": integer }

// Response 201
{
  "upload_id": "uuid",
  "upload_url": "string (URL pré-assinada, válida por 15 min)",
  "storage_key": "string"
}
```
Erros: `413 UPLOAD_TOO_LARGE` · `415 UPLOAD_UNSUPPORTED_FORMAT`

**`POST /v1/uploads/{upload_id}/complete`** — Confirma que o envio direto ao storage terminou; dispara o
pipeline assíncrono de processamento.

```json
// Response 202
{ "status": "processing" }
```

**`GET /v1/uploads/{upload_id}`** — Consulta o status de processamento do upload.

```json
// Response 200
{ "...UploadedContent", "progress_percent": integer }
```

**`GET /v1/uploads/{upload_id}/questions`** — Lista as perguntas geradas pelo pipeline de IA, pendentes
de revisão.

```json
// Response 200
{ "data": [ { "...Question", "source_excerpt": "string" } ] }
```

**`PATCH /v1/uploads/{upload_id}/questions/{question_id}`** — Aprova, edita ou rejeita uma pergunta
gerada.

```json
// Request body
{
  "action": "approve"|"edit"|"reject",
  "edited_fields"?: { "enunciado"?, "opcoes"?, "resposta_correta"? }
}
// Response 200
{ "...Question" }
```
Erros: `409 QUESTION_ALREADY_REVIEWED`

## 8. Gamification Service

**`GET /v1/gamification/me`** — Retorna o `GamificationProfile` completo do usuário.

```json
// Response 200
{ "...GamificationProfile", "achievements": [ {"type", "unlocked_at"} ] }
```

**`GET /v1/gamification/league`** — Retorna o ranking da liga semanal do usuário autenticado.

```json
// Response 200
{
  "league_id": "uuid",
  "tier": integer,
  "week_reference": "date",
  "ranking": [ { "user_id", "name", "xp_this_week", "position" } ]
}
```

**`POST /v1/gamification/streak/freeze`** — Consome um congelador de streak disponível para perdoar o
dia atual.

```json
// Response 200
{ "streak_freezes_available": integer }
```
Erros: `409 NO_STREAK_FREEZE_AVAILABLE`

**`POST /v1/gamification/shop/purchase`** — Compra um item da loja com gemas. Requer cabeçalho
`Idempotency-Key`.

```json
// Request body
{ "item_id": "string" }
// Response 200
{ "gems_restantes": integer, "item": { "id", "tipo" } }
```
Erros: `402 INSUFFICIENT_GEMS` · `404 ITEM_NOT_FOUND`

## 9. Notifications Service

**`GET /v1/notifications`** — Lista notificações in-app do usuário, mais recentes primeiro.

```json
// Response 200
{ "data": [ { "id", "type", "message", "read", "created_at" } ] }
```

**`PATCH /v1/notifications/preferences`** — Atualiza preferências de canais de notificação.

```json
// Request body
{ "push_enabled"?: boolean, "email_enabled"?: boolean }
// Response 200
{ "...preferences" }
```

## 10. Teacher / Analytics API

**`GET /v1/teacher/classes/{class_id}/summary`** — Restrito a `role=teacher`. Retorna métricas
agregadas de engajamento da turma.

```json
// Response 200
{
  "students_count": integer,
  "avg_streak": number,
  "avg_accuracy": number,
  "weak_topics": [ { "topic", "accuracy_rate" } ]
}
```
Erros: `403 FORBIDDEN_ROLE`

## 11. Eventos Assíncronos (referência)

Além da API síncrona, o sistema emite eventos internos consumidos por outros serviços (não expostos
diretamente a clientes externos). Os contratos completos estão detalhados no
`ArqLearn_TDD_Technical_Design_Document.md` §7.

Tópicos principais: `content.uploaded`, `questions.generated`, `lesson.answer_submitted`,
`gamification.xp_awarded`, `gamification.streak_at_risk`, `league.week_closed`, `infinite_mode.session_ended`,
`content.summary_generated`, `material.chat_message_sent` *(os três últimos adicionados na v1.1; contratos
completos a detalhar no TDD quando a implementação desses três recursos começar)*.

## 12. Catálogo de Códigos de Erro

| Código | HTTP | Descrição |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Corpo da requisição não passou na validação de schema. |
| `UNAUTHENTICATED` | 401 | Token ausente, expirado ou com assinatura inválida (validado contra o Supabase Auth, ver §4). *(v1.3)* |
| `FORBIDDEN_ROLE` | 403 | Usuário sem papel/permissão para o recurso. |
| `TRACK_NOT_FOUND` | 404 | Trilha inexistente ou sem acesso. |
| `LESSON_NOT_FOUND` | 404 | Lição inexistente. *(v1.4)* |
| `LESSON_NO_HEARTS_LEFT` | 409 | Sem vidas disponíveis para iniciar sessão. |
| `SESSION_NOT_FOUND` | 404 | Sessão de prática (ou de Modo Infinito, v1.1) inexistente. |
| `SESSION_EXPIRED` | 410 | Sessão expirada por inatividade (>30 min). |
| `UPLOAD_TOO_LARGE` | 413 | Arquivo excede 2 GB. |
| `UPLOAD_UNSUPPORTED_FORMAT` | 415 | Tipo de arquivo não suportado. |
| `UPLOAD_NOT_READY` | 409 | Upload ainda não terminou o processamento — resumo/chat indisponíveis. *(v1.1)* |
| `QUESTION_ALREADY_REVIEWED` | 409 | Pergunta já aprovada/rejeitada anteriormente. |
| `QUESTION_OUT_OF_SCOPE` | 422 | Pergunta do chat fora do domínio de Arquitetura/Urbanismo ou sem relação com o material enviado. *(v1.1)* |
| `NO_STREAK_FREEZE_AVAILABLE` | 409 | Sem congeladores de streak disponíveis. |
| `INSUFFICIENT_GEMS` | 402 | Saldo de gemas insuficiente para a compra. |
| `RATE_LIMITED` | 429 | Limite de requisições excedido. |

*Tabela — Catálogo consolidado de códigos de erro da API.*

> Atingir o limite diário de XP (v1.2) **não** gera um código de erro — não é uma condição de bloqueio,
> apenas informativa via `xp_daily_cap_reached` (ver §3.2 e §6). Ver TDD §3.2.

## 13. Versionamento e Depreciação

- Campos novos e opcionais podem ser adicionados a qualquer momento sem quebra de versão.
- Remoção de campo, mudança de tipo ou de semântica exigem nova versão de path (`/v2`), mantendo `/v1`
  ativo por no mínimo 6 meses após o anúncio de depreciação.
- Endpoints depreciados retornam o cabeçalho `Deprecation: true` e `Sunset: <data>` durante o período de
  transição.

— Fim do documento —
