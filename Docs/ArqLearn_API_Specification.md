# API SPECIFICATION
## ArqLearn

Especificação de referência dos endpoints REST expostos pelo API Gateway.

Versão 1.23 | Agosto de 2026
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
| 1.6 | 08/08/2026 | Equipe de Engenharia | Adiciona `POST /v1/lessons/{lesson_id}/questions/{question_id}/explain` ("explique melhor", Persona Prompt §5) e o erro `AI_PROVIDER_ERROR` — primeiro endpoint que chama um provedor de IA de forma síncrona (Groq) |
| 1.7 | 08/08/2026 | Equipe de Engenharia | Nota em §7: geração de pergunta por IA já funciona de ponta a ponta (Gemini), mas por CLI direto no banco — não pelos endpoints `/uploads/{upload_id}/questions` desta seção, que continuam stub porque dependem de uma coleção `uploads` nunca desenhada. Nenhum contrato mudou |
| 1.8 | 09/08/2026 | Equipe de Engenharia | §7: `POST /v1/uploads`, `POST /v1/uploads/{upload_id}/complete` e `GET /v1/uploads/{upload_id}` deixam de ser stub — implementados contra a tabela `uploads` (Postgres) real e testados ao vivo. `GET/PATCH .../questions` continuam stub. Nenhum contrato mudou |
| 1.9 | 09/08/2026 | Equipe de Engenharia | §6.1: decisão de "sem geração dedicada" revisada a pedido do usuário — tópico `"maquetes"` passa a gerar lotes novos em segundo plano, persistidos como lição permanente. Endpoints deixam de ser stub. Adiciona campo `level` na resposta de `/answers` |
| 1.10 | 09/08/2026 | Equipe de Engenharia | §7: adiciona `GET /v1/uploads` (listagem, paginada) — endpoint novo, não existia em nenhuma versão anterior. Fecha a lacuna que deixava a tela "Meus Materiais" do Explorar sem alternativa a não ser mock (ver `Docs/PENDENCIAS_WEB_REAL.md`) |
| 1.11 | 09/08/2026 | Equipe de Engenharia | §9: `GET /v1/notifications` e `PATCH /v1/notifications/preferences` deixam de ser stub — implementados contra a nova coleção `notifications` (MongoDB) e as colunas `push_enabled`/`email_enabled` de `users` (Postgres). Lista de notificações real, mas legitimamente vazia hoje (nenhum gatilho escreve nela ainda). Nenhum contrato mudou |
| 1.12 | 09/08/2026 | Equipe de Engenharia | §3.2: adiciona `hearts_next_at` ao `GamificationProfile` (a pedido do usuário) — vidas agora regeneram sozinhas com o tempo (TDD §5.4, novo); `hearts_current` nunca fazia isso antes |
| 1.13 | 09/08/2026 | Equipe de Engenharia | §6.2/§6.3: `GET /v1/uploads/{upload_id}/summary`, `POST /v1/uploads/{upload_id}/chat` e `GET .../chat` deixam de ser stub — implementados contra `content_chunks` (pgvector) e as coleções `content_summaries`/`material_chat_messages` (ambas já desenhadas desde a v1.1). Testado ao vivo com upload/chunks semeados manualmente (sem depender do bloqueio de R2, ver `Docs/PENDENCIAS_IA.md` #1) — em produção, indisponível até existir upload real processado. Nenhum contrato mudou |
| 1.14 | 09/08/2026 | Equipe de Engenharia | Adiciona §14 Ajuda e Bugs (a pedido do usuário) — 3 endpoints novos (`POST /v1/bug-reports`, `GET /v1/bug-reports`, `POST /v1/bug-reports/{id}/resolve`), nova coleção `bug_reports` (Database Design), print embutido como base64 (contorna o bloqueio de R2, `Docs/PENDENCIAS_IA.md` #1). Primeiro endpoint com checagem de papel (admin) no backend — não existia nenhuma antes |
| 1.15 | 09/08/2026 | Equipe de Engenharia | §14: adiciona `type` (`bug \| suggestion`) e `device_model`/`device_type` a `bug_reports` (a pedido do usuário) — recompensa por resolução passa a depender do tipo: bug corrigido sobe de 5 pra **10 gemas**, sugestão implementada vale **50 gemas** (notificação nova `suggestion_implemented`, §9) |
| 1.16 | 09/08/2026 | Equipe de Engenharia | §8: `achievements` em `GET /v1/gamification/me` passa a ser preenchido de verdade — desde a v1.0 a tabela existia mas nada nunca gravava nela. Catálogo de ~44 conquistas (a pedido do usuário) cobrindo lições, Modo Infinito, streak, Loja, Materiais e relatos de bug, a maioria em 5 níveis progressivos; cada desbloqueio credita XP/gemas uma única vez. Nenhum contrato mudou — resposta já era `{type, unlocked_at}[]` |
| 1.17 | 15/08/2026 | Equipe de Engenharia | §3.2: adiciona `streak_freezes_available`/`streak_at_risk` ao `GamificationProfile` — streak agora expira sozinha após 24h sem prática (expiração preguiçosa, TDD §5.2/§5.3, mesmo padrão da regeneração de vidas §5.4, sem job/cron), consumindo automaticamente um Bloqueio de Ofensiva por dia faltante quando disponível. §8: `POST /v1/gamification/streak/freeze` passa a também avançar `streak_last_active_date` (uso manual, diferente do consumo automático — ver nota) |
| 1.18 | 15/08/2026 | Equipe de Engenharia | §8.1 (novo): Baú Diário — a pedido do usuário, 1 abertura por dia local ao responder 10 perguntas no dia (lição + Modo Infinito somados). `GET /v1/gamification/daily-chest` (status) e `POST .../daily-chest/open` (sorteia 75% gemas 1-5 / 25% item consumível grátis — Bloqueio de Ofensiva ou Recarga de Vidas) são endpoints novos. §6/§6.1: `POST .../answers` (lição e Modo Infinito) ganham `daily_chest_available`/`daily_chest_questions` na resposta |
| 1.19 | 15/08/2026 | Equipe de Engenharia | §8.2 (novo): Baú Semanal — a pedido do usuário, 1 abertura por ciclo rolante de 7 dias ao responder 50 perguntas dentro do ciclo (mesma contagem lição + Modo Infinito do Baú Diário). Ciclo só reseta quando 7 dias se passam desde o início do ciclo vigente — abrir antes disso não adianta o reset (decisão explícita do usuário). `GET /v1/gamification/weekly-chest` (status) e `POST .../weekly-chest/open` (sorteia 60% gemas 5-15 / 40% item — recompensa maior que o Baú Diário, reflete o esforço extra) são endpoints novos |
| 1.20 | 18/08/2026 | Equipe de Engenharia | §8.1/§8.2: Baú Diário e Semanal passam a contar só respostas **certas** ("acertar N perguntas"), não mais toda resposta certa ou errada — reverte a decisão da v1.18/v1.19 a pedido do usuário, após achado em teste ao vivo em device real (confuso contar erro como progresso). Nenhum contrato/campo mudou, só a regra de quando `chest_questions_today`/`chest_weekly_questions` incrementam |
| 1.21 | 18/08/2026 | Equipe de Engenharia | §9 (novo): `POST /v1/notifications/push-token` — registra/atualiza o token de push Expo do device atual, a pedido do usuário (infraestrutura de push notification real, antes só a preferência `push_enabled` existia sem nada consumi-la). Primeiro gatilho real: streak em risco, via `cmd/notify-streak-risk` (operacional, sem scheduler nesta fase, mesmo padrão de `cmd/close-league-week`) |
| 1.22 | 18/08/2026 | Equipe de Engenharia | §6: `POST /v1/lessons/{lesson_id}/answers` passa a exigir o cabeçalho `Idempotency-Key` (mesmo padrão de `POST /v1/gamification/shop/purchase`, §2.6/§8) — achado em `/impeccable critique`: sem isto, um retry de rede reprocessava a resposta inteira (XP, vidas, streak, baú e conquistas contados de novo). Novo erro `IDEMPOTENCY_KEY_REQUIRED` (400). §2.6: nota sobre a janela de 24h mencionada ali não ser de fato implementada em nenhum dos dois endpoints hoje (chave sem expiração) — divergência sinalizada, não corrigida nesta versão |
| 1.23 | 20/08/2026 | Equipe de Engenharia | §3.2: adiciona `cosmetics` ao `GamificationProfile` (`GET /v1/gamification/me` e `GET /v1/users/me`) — inventário de posse dos itens `category='cosmetic'` da Loja (`user_cosmetics`, Database Design v1.19); achado do porte de gamificação (`Docs/ArqLearn_Backlog_Gamificacao_Atelie.md`): comprar um cosmético não deixava nenhum registro de posse antes disso |

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

Operações POST sensíveis a duplicação (compra na loja, submissão de resposta de exercício) **exigem**
o cabeçalho `Idempotency-Key` (ausente = `400 IDEMPOTENCY_KEY_REQUIRED`); requisições repetidas com a
mesma chave retornam a resposta original sem reprocessar.

> **Nota (v1.22):** a menção a "em até 24h" acima descreve o comportamento pretendido, não o
> implementado — nem `purchases.idempotency_key` (compra) nem `answer_submissions.idempotency_key`
> (resposta) têm expiração real hoje; a chave é válida indefinidamente em ambos. Divergência
> conhecida, sinalizada e não corrigida nesta versão (ver `Docs/CLAUDE.md` sobre não resolver
> divergência código/doc silenciosamente) — expiração real de chave fica como pendência futura se
> o volume de tráfego algum dia justificar limpar a tabela.

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
| `streak_current` | integer | Sequência atual de dias consecutivos. Expira sozinha (TDD §5.2/§5.3) — ver nota em `GET /v1/gamification/me` abaixo. |
| `streak_best` | integer | Recorde pessoal de streak. |
| `streak_freezes_available` | integer | Quantos Bloqueios de Ofensiva o usuário tem em estoque — mesmo valor devolvido por `POST .../streak/freeze`. *(v1.17)* |
| `streak_at_risk` | boolean | `true` quando a streak é positiva e o usuário ainda não praticou hoje (TDD §5.2) — sinal pro cliente oferecer usar um Bloqueio de Ofensiva proativamente ao abrir o app, em vez de só descobrir a perda no dia seguinte. *(v1.17)* |
| `hearts_current` | integer | Vidas disponíveis (0–5). |
| `hearts_next_at` | datetime \| null | Instante em que a próxima vida será regenerada (TDD §5.4) — `null` quando `hearts_current` já está no teto (5). Cliente calcula a contagem regressiva localmente a partir deste timestamp fixo. *(v1.12)* |
| `gems` | integer | Moeda virtual acumulada. |
| `league_tier` | integer | Tier da liga semanal atual. |
| `is_vip` | boolean | VIP "Mestre Arquiteto" ativo agora — já reflete a expiração preguiçosa (`EhVIPAtivo`, ver §8.3); nunca `true` com `vip_expires_at` no passado. *(v1.20)* |
| `vip_expires_at` | datetime \| null | Instante em que o VIP expira. `null` quando não há VIP ativo, **ou** quando é vitalício (concedido sem prazo) — distinguir os dois casos exige olhar `is_vip` junto. *(v1.20)* |
| `cosmetics` | `{item_id, name, equipped, acquired_at}[]` | Itens `category='cosmetic'` da Loja que o usuário já possui (`user_cosmetics`, Database Design v1.19) — antes disso, comprar um cosmético não deixava nenhum registro de posse. `equipped` sempre `true` por ora (sem tela de "trocar equipado" ainda). *(v1.23)* |

### 3.3 Track / Lesson / Question

| Campo | Tipo | Descrição |
|---|---|---|
| `track.id` | string | Identificador da trilha. |
| `track.origin` | enum | `curated` \| `user_generated`. |
| `lesson.id` | string | Identificador da lição. |
| `lesson.order` | integer | Posição da lição dentro da trilha (1-based), derivada de `track.units[].lesson_ids` — não é um campo salvo em `lessons`, é calculado a cada resposta. *(v1.5)* |
| `question.type` | enum | `multiple_choice` \| `true_false` \| `matching` \| `fill_blank` \| `image_identification`. |
| `question.difficulty` | enum | `easy` \| `medium` \| `hard` \| `impossible`. |
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

**`GET /v1/users/me/export`** — Portabilidade de dados (LGPD, direito de acesso). Reúne num único
JSON tudo que este serviço guarda sobre a conta autenticada: perfil, gamificação, conquistas e
resumo de progresso. Não inclui credenciais (e-mail/senha são do Supabase Auth, nunca passam por
este serviço) nem dados de outros usuários. `Content-Disposition: attachment` já vem setado —
pensado pra download direto.

```json
// Response 200
{
  "exported_at": "datetime",
  "user": { "id", "name", "email", "role", "timezone", "created_at" },
  "gamification": {
    "xp_total", "level", "streak_current", "streak_best", "hearts_current", "gems", "current_tier"
  },
  "achievements": [ { "type", "unlocked_at" } ],
  "progress": { "tracks_in_progress", "tracks_completed", "lessons_completed_last_7d", "accuracy_rate" }
}
```

## 6. Learning Service

**`GET /v1/tracks`** — Lista trilhas disponíveis. Suporta filtro por `topic` e `origin`.

```
Query: ?topic=urbanismo&origin=curated&limit=20&cursor=...
Response 200: { "data": [ {"...Track"} ], "next_cursor": "string|null" }
```

**`GET /v1/tracks/{track_id}/lessons`** — Lista as lições de uma trilha, com o progresso do usuário
autenticado e `has_questions` (se a lição tem pelo menos uma pergunta com `review_status:
"approved"` — mesmo filtro de `POST .../session`) embutidos em cada item. `has_questions: false`
é o sinal de "em construção" pro cliente — uma lição sem conteúdo aprovado ainda não deveria ficar
bloqueada por sequência, e sim mostrar esse estado; `has_questions: true` deveria ficar acessível
independente de `progress_status`.

```json
// Response 200
{
  "data": [
    {
      "lesson": { "...Lesson" },
      "progress_status": "not_started"|"in_progress"|"completed",
      "has_questions": boolean
    }
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
ativa. Requer cabeçalho `Idempotency-Key` *(v1.22 — ver §2.6)*.

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
  "explicacao": "string",
  "daily_chest_available": boolean,
  "daily_chest_questions": integer
}
```
`xp_ganho` já vem líquido do limite diário de XP (TDD §3.2) — quando `xp_daily_cap_reached` é `true`,
`xp_ganho` pode ser `0` mesmo com `correct: true`. *(campo `xp_daily_cap_reached` adicionado na v1.2)*
`daily_chest_available`/`daily_chest_questions` *(v1.18)* — ver §8.1 Baú Diário.

> **v1.5 — `answer` é id, não texto.** O corpo aceita o `id` da opção escolhida (ex.: `"b"`), não o
> texto da resposta. Decisão tomada ao integrar com o app: comparar texto literal é frágil (acento,
> maiúscula/minúscula, normalização Unicode — ver `Docs/CLAUDE.md` para um caso real de falso-negativo
> encontrado por causa disso) e obriga o cliente a conhecer o texto exato da resposta certa antes de o
> usuário responder, quando só precisa saber qual opção ele tocou. O texto de cada opção continua
> guardado como string simples em `questions.options` (Database Design §4.3) — o id é derivado da
> posição só na hora de montar a resposta da API, nunca persistido.

Erros: `400 IDEMPOTENCY_KEY_REQUIRED` · `404 SESSION_NOT_FOUND` · `410 SESSION_EXPIRED`

**`POST /v1/lessons/{lesson_id}/questions/{question_id}/explain`** *(v1.6)* — "Explique melhor": aprofunda,
sob demanda, a explicação curta já devolvida por `POST .../answers` (Persona Prompt §5, "Se o usuário
pedir para 'explicar melhor'"). Chamada síncrona a um provedor de IA (Groq, escolhido pela baixa
latência) — distinta da explicação curta em `explicacao`, que é pré-gerada na criação da pergunta e não
tem custo de IA por resposta errada.

```json
// Request body (opcional)
{ "selected_option_id": "string (id da opção que o usuário escolheu, ex.: \"b\") — opcional, enriquece a resposta" }

// Response 200
{ "deep_explanation": "string" }
```
Erros: `404 QUESTION_NOT_FOUND` · `502 AI_PROVIDER_ERROR` · `503 SERVICE_UNAVAILABLE` (sem provedor de IA configurado)

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

> **Decisão (Docs/PENDENCIAS_IA.md #7, revisada 08/2026):** Modo Infinito serve perguntas do pool de
> `questions` com `review_status: "approved"`, filtrando por `tracks.topic` igual ao `topic` pedido —
> essa parte não mudou. O que mudou: para o tópico `"maquetes"` (único com texto-fonte real embutido no
> backend, `monolith/internal/questiongen/sourcetext`), o pool cresce sozinho: a cada 20 perguntas
> respondidas numa sessão, um lote novo de 20 é gerado em segundo plano (Gemini, disparado na 15ª
> resposta do bloco para estar pronto antes de o bloco atual acabar) e persistido como **Lição
> permanente**, anexada à trilha (`track_s02_maquetes`, unidade "Conteúdo gerado pelo Modo Infinito") —
> não é conteúdo efêmero da sessão, fica disponível também no modo de lição normal depois. Os outros 7
> temas do catálogo continuam sem geração dedicada (só pool fixo existente), porque não têm texto-fonte
> carregado — gerar sem lastro num texto-fonte violaria a regra de nunca alucinar conteúdo. Endpoints
> abaixo são reais (não são mais stub).

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
próxima questão do modo infinito. Requer cabeçalho `Idempotency-Key` *(v1.22 — ver §2.6)*.

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
  "level": integer,
  "next_question": { "...Question" },
  "daily_chest_available": boolean,
  "daily_chest_questions": integer
}
```
`next_question` ausente quando o banco de perguntas do tópico se esgota — cliente deve tratar como fim
de sessão nesse caso. Campo `xp_daily_cap_reached` adicionado na v1.2, mesmo comportamento de §6.
`level` adicionado na v1.3 = `floor(questions_answered / 20) + 1`, calculado pro cliente exibir "Nível
N" sem duplicar a conta — todo tópico ganha esse número, mas só `"maquetes"` de fato gera lição nova a
cada nível (ver decisão acima). `daily_chest_available`/`daily_chest_questions` *(v1.18)* — ver §8.1
Baú Diário; Modo Infinito soma pro mesmo contador acumulado do dia que lição usa.

Erros: `400 IDEMPOTENCY_KEY_REQUIRED` *(v1.22)*.

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

> **v1.13 — real** (Groq, mesmo provedor de §5.3 "explique melhor", escolhido pela mesma razão:
> chamada síncrona que o usuário está esperando responder). Consome `content_chunks` (pgvector,
> Database Design §5) — RAG simplificado, sem busca por similaridade ainda (usa todos os chunks do
> upload, mesma decisão de `cmd/generate-questions -upload-id=`). Cacheado em `content_summaries`
> (Database Design §4.7) — só gera uma vez por upload. Testado ao vivo com upload/chunks semeados
> manualmente no banco; em produção fica indisponível até um upload real terminar de processar
> (bloqueado por R2, ver `Docs/PENDENCIAS_IA.md` #1) — não é uma limitação deste endpoint.

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

> **v1.13 — os três endpoints abaixo são reais** (Groq, JSON mode — o modelo sinaliza
> `in_scope: false` quando a pergunta foge do material, o que vira `422 QUESTION_OUT_OF_SCOPE`,
> Persona Prompt §7.2). Mesmo RAG simplificado de §6.2 (todos os chunks do upload). Histórico
> persistido em `material_chat_messages` (Database Design §4.8). Mesma ressalva de §6.2: real e
> testado, mas sem upload real de usuário até o R2 ser habilitado.

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

> **v1.8 — `POST /v1/uploads`, `.../complete` e `GET /v1/uploads/{upload_id}` são reais**, contra a tabela
> `uploads` (Postgres, `Database_Design.md` §5) e `internal/objectstorage` (R2). O binário do arquivo em
> si (extração/chunking/embeddings/geração de pergunta) continua fora deste contrato HTTP — roda por CLI
> operacional (`cmd/ingest-file` + `cmd/generate-questions -upload-id`, `ai-content-pipeline`), não por
> fila/evento (`cmd/worker` ainda não consome SQS de verdade — ver `CLAUDE.md`). `GET/PATCH
> .../questions` (revisão de pergunta gerada por upload pela própria API, não pelo CLI) continuam stub.
> Upload real de arquivo depende do bucket R2 estar habilitado na conta Cloudflare — ver
> `Docs/PENDENCIAS_IA.md` #1.

**`GET /v1/uploads`** *(v1.9)* — Lista os uploads do usuário autenticado, mais recentes primeiro.
Endpoint novo — não existia em nenhuma versão anterior (só `GET /v1/uploads/{upload_id}`, um de cada
vez); faltava pra tela "Meus Materiais" do Explorar (`apps/web`) parar de depender de mock.
Paginação por cursor, mesmo padrão de §2.4.

```json
// Response 200
{ "data": [ {"...UploadedContent", "progress_percent": integer} ], "next_cursor": "string|null" }
```

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

> **v1.16 — `achievements` é real.** Catálogo completo (tipos, condições de desbloqueio, níveis,
> recompensas) vive em `services/monolith/internal/gamification/achievements.go` — não neste
> documento, pra não duplicar a fonte da verdade. `title`/`description`/`icon` de cada conquista
> são conteúdo do cliente (`apps/web/src/lib/gamification/achievementCatalog.ts`), a API só
> devolve `{type, unlocked_at}` como sempre documentado.

**`GET /v1/gamification/me`** — Retorna o `GamificationProfile` completo do usuário.

```json
// Response 200
{ "...GamificationProfile", "achievements": [ {"type", "unlocked_at"} ] }
```

> **`cosmetics` também em `GET /v1/users/me` (v1.23):** `GamificationProfile.cosmetics` é
> compartilhado pelas duas rotas — `LoadOwnedCosmetics` (`internal/gamification`) é chamado por
> `handleGetGamificationMe` e por `handleGetMe` (`internal/users`), mesmo padrão já usado por
> `LoadHeartsWithRegen`/`LoadStreakWithExpiration`/`LoadLeagueTierName`.

> **Expiração preguiçosa de streak (TDD §5.2/§5.3, v1.17):** sem job/cron nesta fase bootstrap
> (mesmo padrão já usado pra regeneração de vidas, TDD §5.4) — `streak_current` é recalculado sob
> demanda a cada leitura (aqui e em `GET /v1/users/me`) e a cada resposta de exercício (`POST
> /v1/lessons/{lesson_id}/answers`, antes de aplicar o incremento do dia), nunca por um worker em
> segundo plano. Se a última prática (`streak_last_active_date`) foi hoje ou ontem, nada muda. Se
> pulou 2+ dias: consome 1 `streak_freezes_available` por dia faltante enquanto houver estoque
> (`streak_current` preservado, `streak_last_active_date` **não avança sozinho** — TDD §5.3
> explícito nisso, é assim que um gap de N dias consome até N freezes em vez de só 1); esgotado o
> estoque, `streak_current` zera. `streak_at_risk` é calculado ao vivo a partir do mesmo estado
> (streak positiva + ainda sem prática hoje) — é o gatilho do cliente pra abrir o diálogo de
> Bloqueio de Ofensiva sozinho ao carregar o app, sem esperar a pessoa procurar a tela Perfil.

**`GET /v1/gamification/league`** — Hierarquia de 10 ligas (pior → melhor: Madeira, Pedra,
Bronze, Prata, Ouro, Platina, Esmeralda, Safira, Rubi, Diamante), cada uma com 3 divisões internas
(3 = entrada, 1 = mais avançada) — 30 posições lineares no total. Internamente é um único rank
1..30 (`user_gamification.current_tier`/`leagues.tier`); `tierName`/`rankDivision`
(`internal/gamification/gamification.go`) derivam liga+divisão a partir dele.

Sem query string: retorna o ranking da liga/divisão semanal do usuário autenticado (matricula
automaticamente se ainda não estiver). Com `?tier=madeira|pedra|bronze|prata|ouro|platina|
esmeralda|safira|rubi|diamante` (e opcionalmente `&division=1|2|3`, default `1`): retorna o
ranking daquela liga/divisão na semana corrente sem matricular o chamador — pra navegar outras
ligas; se ninguém estiver lá ainda esta semana, devolve `ranking: []` (200, não é erro).
`viewer_position`/`xp_to_promotion` só vêm preenchidos na consulta sem `?tier=` (a liga do próprio
usuário) — projeção em cima do ranking em curso de quanto XP falta pra entrar na zona de promoção
se a semana fechasse agora (não depende do fechamento semanal já ter rodado); omitidos quando o
grupo ainda não tem gente suficiente pra uma promoção real (ver `CloseLeagueWeek` abaixo) ou o
usuário já está na posição mais alta (Diamante 1).

```json
// Response 200
{
  "league_id": "uuid",
  "tier": "madeira",
  "division": 3,
  "week_reference": "date",
  "ranking": [ { "user_id", "name", "xp_this_week", "position" } ],
  "promotion_slots": 3,
  "demotion_slots": 3,
  "viewer_position": integer | null,
  "xp_to_promotion": integer | null
}
```
Erros: `400 INVALID_TIER` (valor de `?tier=` fora das 10 ligas) · `400 INVALID_DIVISION` (`?division=`
fora de 1/2/3).

> **Fechamento semanal (TDD §6):** `internal/gamification.CloseLeagueWeek` implementa o algoritmo
> de promoção/rebaixamento (top `promotion_slots` sobe uma divisão — ou pra divisão 3 da próxima
> liga, se já estiver na divisão 1 —, bottom `demotion_slots` desce uma divisão, grava o novo rank
> em `user_gamification.current_tier`) — real, mas só roda via `cmd/close-league-week`,
> operacional (sem scheduler automático nesta fase, ver `Docs/ArqLearn_Estrategia_Bootstrap.md`).
> Divisões com menos de `promotion_slots + demotion_slots` membros (o mínimo pra "top 3"/"bottom
> 3" não se sobreporem) não promovem nem rebaixam naquela semana — realidade da fase bootstrap,
> 5-20 usuários, divisões naturalmente pequenas por design (30 delas, não 5 tiers largos).
> Mesclagem de grupos pequenos entre si (TDD §6 passo 1) não está implementada — não há como
> existir mais de um grupo por liga/divisão/semana com o código atual (todo mundo cai em
> `group_number=1`).

**`POST /v1/gamification/streak/freeze`** — Consome um congelador de streak disponível para perdoar o
dia atual.

```json
// Response 200
{ "streak_freezes_available": integer }
```
Erros: `409 NO_STREAK_FREEZE_AVAILABLE`

> **Diferença deliberada do consumo automático (v1.17):** este endpoint (uso manual, proativo —
> tipicamente disparado pelo `streak_at_risk` da nota acima) **avança `streak_last_active_date`
> para hoje**, diferente do consumo automático de `AplicarExpiracaoStreak` (TDD §5.3), que
> deliberadamente não avança essa data. Não é um bug/inconsistência: `AtualizarStreak` (TDD §5.1)
> já trava em no máximo 1 incremento por dia local, então marcar "hoje" como coberto aqui não deixa
> a pessoa dobrar o incremento se também praticar de verdade no mesmo dia — só evita que a mesma
> ausência seja contada de novo caso o usuário volte a abrir o app antes da virada do dia.

**`POST /v1/gamification/shop/purchase`** — Compra um item da loja com gemas. Requer cabeçalho
`Idempotency-Key`.

```json
// Request body
{ "item_id": "string" }
// Response 200
{ "gems_restantes": integer, "item": { "id", "tipo" } }
```
Erros: `402 INSUFFICIENT_GEMS` · `404 ITEM_NOT_FOUND`

### 8.1 Baú Diário *(v1.18)*

A pedido do usuário: 1 baú por dia local, liberado ao **acertar** 10 perguntas no dia (lição OU Modo
Infinito, contagem acumulada, qualquer combinação — não precisa ser na mesma sessão). Só respostas
certas contam *(regra desde v1.20 — antes contava toda resposta, certa ou errada)*. Sem job/cron
— expiração/contagem preguiçosa, mesmo padrão de vidas (TDD §5.4) e streak (§5.2/§5.3):
`internal/gamification.LoadDailyChestStatus` reresolve o contador do dia (`chest_questions_today`/
`chest_questions_date`, mesmo reset preguiçoso de `xp_today`) a cada leitura. O contador em si é
incrementado dentro de `POST /v1/lessons/{lesson_id}/answers` e
`POST /v1/infinite-mode/sessions/{session_id}/answers` (ver §6/§6.1) — as duas respostas ganham
`daily_chest_available`/`daily_chest_questions` pra o cliente saber na hora, sem round-trip extra,
quando a resposta que acabou de mandar foi a 10ª do dia.

**`GET /v1/gamification/daily-chest`** — Status do Baú Diário do usuário autenticado.

```json
// Response 200
{
  "questions_today": integer,
  "questions_required": 10,
  "available": boolean,
  "claimed_today": boolean
}
```

**`POST /v1/gamification/daily-chest/open`** — Abre o Baú Diário disponível e sorteia a
recompensa (`internal/gamification.RolarRecompensaBau`): **75%** gemas (1 a 5, uniforme), **25%**
um item consumível grátis do sistema (metade Bloqueio de Ofensiva, metade Recarga de Vidas — os
dois itens consumíveis reais da Loja, `migrations/0004_shop_items_seed`; cosméticos ficam de fora
do pool). Sem `Idempotency-Key`: a trava de "1 por dia" já é o `chest_claimed_date` em si, gravado
atomicamente com a aplicação do prêmio.

```json
// Response 200 — reward_type: "gems"
{ "reward_type": "gems", "gems_earned": integer, "gems": integer }
// Response 200 — reward_type: "streak_freeze" | "hearts_refill"
{ "reward_type": "streak_freeze", "gems": integer }
```
`gems` é sempre o saldo total após a abertura (igual ao padrão de `gems_restantes` da compra na
Loja), não o quanto foi ganho — `gems_earned` só existe quando `reward_type` é `"gems"`. Erros:
`409 CHEST_NOT_AVAILABLE` (ainda não bateu as 10 perguntas do dia, ou já foi aberto hoje —
reconsultado no servidor, nunca confiado no que o cliente mandou).

### 8.2 Baú Semanal *(v1.19)*

A pedido do usuário: 1 baú por ciclo de 7 dias, liberado ao **acertar** 50 perguntas dentro do ciclo
vigente (lição OU Modo Infinito, mesma contagem acumulada do Baú Diário §8.1 — a mesma resposta
certa soma pros dois contadores independentemente; só respostas certas contam, regra desde v1.20).
Diferente do diário (reset por igualdade de data de calendário), o ciclo semanal é uma janela
**rolante** de 7 dias: começa na primeira pergunta certa respondida depois que não havia ciclo
ativo ou o ciclo anterior já tinha expirado
(`chest_weekly_cycle_start`), e só reseta quando 7 dias já se passaram desde esse início — abrir o
baú antes do fim do ciclo **não** adianta o reset (decisão explícita do usuário: o próximo ciclo só
começa no dia 8, mesmo que o usuário já tenha aberto o baú do ciclo atual no dia 3, por exemplo).
`internal/gamification.LoadWeeklyChestStatus` reresolve o ciclo a cada leitura
(`internal/gamification.QuestoesSemanaAposReset`), mesmo espírito preguiçoso do §8.1, sem job/cron.
O contador é incrementado dentro de `POST /v1/lessons/{lesson_id}/answers` e
`POST /v1/infinite-mode/sessions/{session_id}/answers` (mesmos dois endpoints do §8.1), mas — ao
contrário do Baú Diário — essas respostas **não** ganham campo de status do Baú Semanal (o cliente
consulta `GET /v1/gamification/weekly-chest` à parte, ex.: ao carregar a Home, em vez de a cada
resposta — o card de progresso não precisa de feedback instantâneo por resposta como o CTA do Baú
Diário precisa).

**`GET /v1/gamification/weekly-chest`** — Status do Baú Semanal do usuário autenticado.

```json
// Response 200
{
  "questions_this_cycle": integer,
  "questions_required": 50,
  "available": boolean,
  "claimed_this_cycle": boolean
}
```

**`POST /v1/gamification/weekly-chest/open`** — Abre o Baú Semanal disponível e sorteia a
recompensa (`internal/gamification.RolarRecompensaBauSemanal`) — **maior** que a do Baú Diário,
reflete o esforço extra de 50 perguntas em até 7 dias: **60%** gemas (5 a 15, uniforme, contra 1 a
5 do diário), **40%** um item consumível grátis do sistema (mesmos dois itens do §8.1, metade
Bloqueio de Ofensiva, metade Recarga de Vidas). Trava de "1 por ciclo": grava
`chest_weekly_claimed_cycle_start` = `chest_weekly_cycle_start` vigente no momento da abertura —
comparar os dois valores (em vez de um boolean solto) já resolve sozinho o "desclaim" automático
quando o ciclo vira, sem precisar zerar essa coluna em lugar nenhum.

```json
// Response 200 — reward_type: "gems"
{ "reward_type": "gems", "gems_earned": integer, "gems": integer }
// Response 200 — reward_type: "streak_freeze" | "hearts_refill"
{ "reward_type": "streak_freeze", "gems": integer }
```
Mesmo formato de resposta do §8.1 (`gems` é sempre o saldo total, não o ganho). Erros:
`409 CHEST_NOT_AVAILABLE` (ainda não bateu as 50 perguntas do ciclo, ou já foi aberto neste ciclo —
reconsultado no servidor).

### 8.3 VIP "Mestre Arquiteto" *(v1.20)*

A pedido do usuário: tier de entitlement que multiplica XP, garante recompensa no Baú Semanal e dá
resets extras nos dois baús (§8.1/§8.2), além de identidade visual própria no perfil (cliente only —
coroa, nome em destaque, selo "Mestre Arquiteto", sem campo de API dedicado). Dois caminhos de
ativação:

- **Cupom** (`vip_coupons`, Postgres) — 10 dígitos numéricos, gerado por um administrador
  (`POST /v1/vip/coupons`) e entregue manualmente ao usuário fora do sistema (não há painel admin
  ainda — endpoint chamado direto via curl/Postman). Resgatável uma única vez
  (`POST /v1/vip/coupons/redeem`).
- **Assinatura recorrente** (`POST /v1/vip/subscribe`) — endpoint existe mas está **desabilitado**
  (`internal/gamification.VIPSubscriptionsEnabled = false`, retorna `501
  VIP_SUBSCRIPTION_UNAVAILABLE`) até um gateway de pagamento real (Stripe/RevenueCat/IAP) ser
  integrado — nenhuma cobrança real acontece no projeto hoje.

> **Expiração preguiçosa (mesmo padrão de vidas/streak/baú — TDD §5.4, §5.2/§5.3):**
> `internal/gamification.EhVIPAtivo(is_vip, vip_expires_at, now)` decide se o VIP vale agora, sem
> job/cron: `is_vip=false` nunca é VIP; `is_vip=true` com `vip_expires_at=null` é vitalício;
> `vip_expires_at` no passado desliga o benefício sozinho na próxima leitura, sem UPDATE nenhum
> zerando `is_vip`.

> **+25% de XP** (`internal/gamification.CalcularXP`, parâmetro `vipAtivo`): aplicado ao XP
> calculado da resposta **antes** do teto diário de 500 XP (`DailyXPCap`, TDD §3.2) — VIP não ganha
> um teto maior, só alcança o teto de 500/dia mais rápido. Aplicado nos dois pontos que concedem XP:
> `POST /v1/lessons/{lesson_id}/answers` (§6) e `POST
> /v1/infinite-mode/sessions/{session_id}/answers` (§6.1).

> **Baú Semanal garantido:** para VIP ativo, `POST /v1/gamification/weekly-chest/open` (§8.2)
> **não sorteia** a recompensa — vem sempre `reward_type: "streak_freeze"` (Bloqueio de Ofensiva
> garantido). O Baú Diário (§8.1) continua sorteado normalmente mesmo para VIP.

**`GET /v1/vip/status`** — Status VIP do usuário autenticado, incluindo os resets de baú
disponíveis no período vigente (reset preguiçoso, mesmo padrão do próprio contador de perguntas dos
baús).

```json
// Response 200
{
  "is_vip": boolean,
  "vip_expires_at": "datetime | null",
  "daily_chest_resets_used": integer,
  "daily_chest_resets_max": 1,
  "weekly_chest_resets_used": integer,
  "weekly_chest_resets_max": 2
}
```

**`POST /v1/gamification/daily-chest/reset`** — Benefício VIP: reseta o Baú Diário já reivindicado
hoje, liberando uma nova abertura na hora (não zera `chest_questions_today` — o contador de
perguntas do dia já está acima do teto, só `chest_claimed_date` é limpo). Até **1x por dia local**.

```json
// Response 200
{ "available": true, "resets_used": integer, "resets_max": 1, "questions_required": 10 }
```
Erros: `403 VIP_REQUIRED` · `409 CHEST_NOT_CLAIMED_YET` (baú de hoje ainda não foi aberto — nada
para resetar) · `409 CHEST_RESET_LIMIT_REACHED` (já usou o reset do dia).

**`POST /v1/gamification/weekly-chest/reset`** — Mesmo benefício aplicado ao Baú Semanal, até
**2x por ciclo** de 7 dias vigente (§8.2).

```json
// Response 200
{ "available": true, "resets_used": integer, "resets_max": 2, "questions_required": 50 }
```
Erros: `403 VIP_REQUIRED` · `409 CHEST_NOT_CLAIMED_YET` · `409 CHEST_RESET_LIMIT_REACHED`.

**`POST /v1/vip/coupons`** — Gera um cupom VIP de 10 dígitos numéricos. Requer `role = admin`
(checado direto contra `users.role` — sem middleware de papel dedicado ainda).

```json
// Request body
{ "duration_days": integer }
// Response 201
{ "code": "string (10 dígitos)", "duration_days": integer }
```
Erros: `400 INVALID_BODY` (`duration_days` ausente ou ≤ 0) · `403 ADMIN_REQUIRED`.

**`POST /v1/vip/coupons/redeem`** — Resgata um cupom e ativa/estende o VIP do usuário autenticado
(`internal/gamification.EstenderVIP`: sem VIP ativo conta `duration_days` a partir de agora; com VIP
ainda ativo, empilha a partir da expiração atual em vez de desperdiçar o que sobrava; VIP vitalício
permanece vitalício).

```json
// Request body
{ "code": "string" }
// Response 200
{ "is_vip": true, "vip_expires_at": "datetime | null" }
```
Erros: `400 INVALID_BODY` · `409 COUPON_INVALID` (não existe ou já foi resgatado — mesma mensagem
pros dois casos, pra não confirmar a existência de um código a quem não tem o código de verdade).

**`POST /v1/vip/subscribe`** — Desabilitado nesta fase (ver nota acima). Sempre responde:

```json
// Response 501
{ "error_code": "VIP_SUBSCRIPTION_UNAVAILABLE", "message": "..." }
```

## 9. Notifications Service

> **v1.11 — os três endpoints abaixo são reais** (implementados contra a coleção `notifications`,
> MongoDB — e as colunas `push_enabled`/`email_enabled` de `users`, Postgres). Dois gatilhos
> escrevem notificação in-app de verdade hoje: resolução de bug/sugestão reportados
> (`bugreports.go`) e streak em risco *(v1.21)*. Outros gatilhos (promoção de liga etc.) ainda
> dependem de jobs agendados que não existem, mesmo motivo de `cmd/worker` não consumir fila real
> (ver `Docs/CLAUDE.md`). Ver `Docs/PENDENCIAS_WEB_REAL.md`.

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

**`POST /v1/notifications/push-token`** *(v1.21)* — Registra ou atualiza o token de push Expo
(`ExponentPushToken[...]`) do device atual. `ON CONFLICT` no token, não no usuário: um mesmo
device trocando de conta logada atualiza o `user_id` da linha existente em vez de acumular token
órfão da conta anterior. Sem autenticação de terceiro envolvida — o Expo Push API já gerencia
APNs/FCM pelo `projectId` do app, sem credencial própria (mesmo critério "sem cartão de crédito"
usado pra escolher Gemini/Groq, `Docs/CLAUDE.md`).

```json
// Request body
{ "token": string, "platform"?: "ios" | "android" }
// Response 200
{ "registered": true }
```

**Gatilho: streak em risco** *(v1.21)* — `cmd/notify-streak-risk` (operacional, sem scheduler
automático nesta fase, mesmo padrão de `cmd/close-league-week` §6) varre usuários com
`streak_current > 0` e `push_enabled = true`, aplica a expiração preguiçosa da streak (TDD §5.2/
§5.3) antes de checar `StreakEmRisco`, e para quem está em risco: grava uma notificação in-app
(`type: "streak_at_risk"`) e envia o push de verdade pra todos os tokens registrados do usuário.

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
| `QUESTION_NOT_FOUND` | 404 | Pergunta inexistente. *(v1.6)* |
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
| `AI_PROVIDER_ERROR` | 502 | Falha ao chamar o provedor de IA configurado (ex.: Groq em `.../explain`). *(v1.6)* |
| `BUG_REPORT_NOT_FOUND` | 404 | Relato de bug inexistente. *(v1.14)* |
| `BUG_REPORT_ALREADY_RESOLVED` | 409 | Relato já estava `fixed` — resolver de novo não concede gemas outra vez. *(v1.14)* |
| `PAYLOAD_TOO_LARGE` | 413 | Corpo da requisição excede o limite (ex.: print de bug grande demais). *(v1.14)* |
| `VIP_REQUIRED` | 403 | Endpoint exclusivo de usuário VIP ativo (ex.: reset de baú). *(v1.20)* |
| `CHEST_NOT_CLAIMED_YET` | 409 | Tentou resetar um baú (VIP) que ainda não foi aberto neste período. *(v1.20)* |
| `CHEST_RESET_LIMIT_REACHED` | 409 | VIP já usou todos os resets de baú disponíveis no período vigente. *(v1.20)* |
| `ADMIN_REQUIRED` | 403 | Endpoint restrito a `role=admin` (ex.: gerar cupom VIP). *(v1.20)* |
| `COUPON_INVALID` | 409 | Cupom VIP inexistente ou já resgatado. *(v1.20)* |
| `VIP_SUBSCRIPTION_UNAVAILABLE` | 501 | Assinatura VIP por cartão ainda não integrada a um gateway de pagamento. *(v1.20)* |

*Tabela — Catálogo consolidado de códigos de erro da API.*

> Atingir o limite diário de XP (v1.2) **não** gera um código de erro — não é uma condição de bloqueio,
> apenas informativa via `xp_daily_cap_reached` (ver §3.2 e §6). Ver TDD §3.2.

## 13. Versionamento e Depreciação

- Campos novos e opcionais podem ser adicionados a qualquer momento sem quebra de versão.
- Remoção de campo, mudança de tipo ou de semântica exigem nova versão de path (`/v2`), mantendo `/v1`
  ativo por no mínimo 6 meses após o anúncio de depreciação.
- Endpoints depreciados retornam o cabeçalho `Deprecation: true` e `Sunset: <data>` durante o período de
  transição.

## 14. Ajuda e Bugs *(v1.13, v1.15 — a pedido do usuário)*

Aba "Ajuda e Bugs" do app: conteúdo estático de explicação (sem endpoint — vive só no cliente) mais um
canal pra qualquer usuário reportar um **bug** ou sugerir uma **melhoria** — dois `type` do mesmo recurso
`bug_reports` (coleção mantém o nome original por continuidade; ver Database Design §4.4.5), não dois
sistemas separados. Recompensa em gemas depende do tipo quando um admin resolve o relato:

| Tipo | Ganha ao ser resolvido |
|---|---|
| `bug` | **10 gemas** *(v1.15 — antes 5)* + notificação `bug_fixed` |
| `suggestion` | **50 gemas** + notificação `suggestion_implemented` |

Sem endpoint de catálogo/listagem de FAQ — o conteúdo de ajuda é texto fixo no app, igual ao catálogo da
Loja (§8).

> **Decisão de armazenamento do print:** o fluxo de upload real (§7) depende do R2, que está bloqueado
> na conta Cloudflare (`Docs/PENDENCIAS_IA.md` #1) — em vez de esperar isso, o print vai embutido como
> base64 dentro do próprio documento MongoDB (Database Design, coleção `bug_reports`), limitado a ~2MB
> de payload. Migrar pra um `storage_key` do R2 é um swap de campo isolado quando o bloqueio for
> resolvido, não uma mudança de contrato pros clientes.

**`POST /v1/bug-reports`** — Envia um novo relato. Qualquer usuário autenticado.

```json
// Request body
{
  "type": "bug | suggestion",
  "description": "string (obrigatório, 10-2000 caracteres)",
  "screenshot_base64": "string | null",
  "device_model": "string | null",
  "device_type": "mobile | desktop | tablet | null"
}

// Response 201
{ "id": "uuid", "status": "open", "created_at": "datetime" }
```
`device_model`/`device_type` só fazem sentido pra `type: "bug"` *(v1.15)* — cliente só mostra esses
campos no formulário quando "Reportar bug" está selecionado; o backend aceita (e ignora silenciosamente)
se vierem preenchidos numa `suggestion`, não é um erro de validação.

Erros: `422 VALIDATION_ERROR` (descrição vazia/curta demais, ou `type` ausente/inválido) ·
`413 PAYLOAD_TOO_LARGE` (print grande demais, corpo da requisição limitado a ~3MB pra caber a
codificação base64 de ~2MB de imagem)

**`GET /v1/bug-reports`** — Lista relatos, mais recentes primeiro. **Somente admin.**

```
GET /v1/bug-reports?status=open&type=bug&limit=20&cursor=...
```
`type` é opcional (omitido = os dois tipos juntos), mesma convenção de `status`.
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "reporter_name": "string",
      "reporter_email": "string",
      "type": "bug | suggestion",
      "description": "string",
      "screenshot_base64": "string | null",
      "device_model": "string | null",
      "device_type": "mobile | desktop | tablet | null",
      "status": "open | fixed",
      "created_at": "datetime",
      "resolved_at": "datetime | null"
    }
  ],
  "next_cursor": "string | null"
}
```
Erros: `403 FORBIDDEN_ROLE` (autenticado, mas não é admin)

**`POST /v1/bug-reports/{id}/resolve`** — Marca um relato como resolvido (`status: "fixed"` pros dois
tipos — "fixed" aqui significa "corrigido" pra bug e "implementada" pra melhoria; cliente traduz o
rótulo pela leitura de `type`, o backend não duplica o enum de status por tipo). **Somente admin.** Efeito
colateral duplo, ambos síncronos dentro do mesmo handler (volume baixo o suficiente pra não precisar de
fila/evento dedicado, diferente de `gamification.xp_awarded` em §7.4): concede a quantidade de gemas da
tabela acima ao autor do relato (`user_gamification.gems += N`, `N` depende de `type`) e insere a
notificação correspondente (`bug_fixed` ou `suggestion_implemented`, §9) pra ele.

```json
// Response 200
{ "id": "uuid", "status": "fixed", "gems_awarded": 10, "reporter_gems_total": integer }
```
`gems_awarded` é `10` ou `50` conforme `type` do relato — o cliente não escolhe, é sempre o valor fixo da
tabela acima.

Erros: `403 FORBIDDEN_ROLE` · `404 BUG_REPORT_NOT_FOUND` · `409 BUG_REPORT_ALREADY_RESOLVED` (idempotência
por status — resolver de novo um relato já `fixed` não concede gemas uma segunda vez)

— Fim do documento —
