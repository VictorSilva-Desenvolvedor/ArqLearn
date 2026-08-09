# Pendências — telas do app web ainda mockadas

> Registro de trabalho, no mesmo espírito de `PENDENCIAS_IA.md`: o que ficou real (auth real de
> verdade — Maria/Marina/Admin, `Docs/CLAUDE.md` §Stack) e o que continua mockado porque o backend
> por trás simplesmente ainda não existe. Cada item aqui é "endpoint(s) faltando", não "bug de
> frontend" — o lado `apps/web` já está pronto pra virar real assim que o backend existir (é só
> adicionar o nome do recurso em `NEXT_PUBLIC_API_REAL_RESOURCES`, ver `lib/api/config.ts`).
> Apagar cada item conforme for endereçado.

## O que já é real hoje (contexto, não pendência)

Com auth real (Supabase, `apps/web/.env.local` → `NEXT_PUBLIC_API_REAL_RESOURCES=users,tracks,lessons`):

- **Perfil básico** — nome, e-mail, papel, XP total/hoje, nível, streak atual/melhor, vidas, gems
  (tudo dentro de `GET /v1/users/me`, que já faz join com `user_gamification` no Postgres).
- **Trilhas e lições** — `GET /v1/tracks`, `GET /v1/tracks/{id}/lessons`.
- **Sessão de prática (quiz) completa** — iniciar sessão, responder pergunta (XP/vidas/streak
  atualizados de verdade via `internal/gamification/algorithms.go`), e agora também **"Explique
  melhor"** (`POST .../questions/{id}/explain`, Groq) — construído nesta demanda, não existia
  nenhuma UI pra isso antes (o backend já era real desde antes, só faltava o botão).
- Perguntas reais existem pra `track_s02_maquetes` (56 aprovadas) — é a trilha certa pra testar o
  fluxo de prática de ponta a ponta com uma conta real.

## Pendências (backend não existe — endpoint responde 501 `NOT_IMPLEMENTED`)

Todas as rotas abaixo já estão registradas no mux (`internal/*/​*.go`, `apierror.NotImplemented`) —
o contrato já está documentado em `ArqLearn_API_Specification.md`, só falta implementar o handler.

### 1. Configurações (`/perfil/configuracoes`) — editar perfil / apagar conta
- `PATCH /v1/users/me`, `DELETE /v1/users/me` — stub em `internal/users/users.go`.
- Frontend já pronto: `lib/api/resources/profile.ts` (`updateMe`/`deleteMe`), gated por um recurso
  próprio (`"users-write"`, deliberadamente **separado** de `"users"` — GET já é real, PATCH/DELETE
  não, então não dava pra usar a mesma flag sem quebrar a tela assim que "users" virasse real).
- Tamanho: pequeno. `PATCH` é um `UPDATE users SET name=..., timezone=...`; `DELETE` precisa decidir
  soft-delete (`deleted_at`, já existe a coluna) vs hard-delete + prazo de graça LGPD (mock hoje
  simula 30 dias, ver `DeleteMeResponse`).
- Pra ativar: implementar os dois handlers, adicionar `"users-write"` em `NEXT_PUBLIC_API_REAL_RESOURCES`.

### 2. Liga (`/liga`) e Loja (`/loja`) — Gamification Service
- `GET /v1/gamification/me`, `GET /v1/gamification/league`, `POST /v1/gamification/streak/freeze`,
  `POST /v1/gamification/shop/purchase` — todos stub em `internal/gamification/gamification.go`.
- **As regras de negócio já existem e já são testadas** (`algorithms.go`: `CalcularXP`, `Nivel`,
  `AtualizarStreak`) — falta só a camada HTTP (ler/gravar Postgres, chamar as funções puras).
- **As tabelas Postgres também já existem** (`migrations/0001_init.up.sql`): `leagues`,
  `league_members`, `achievements`, `shop_items`, `purchases`. Ninguém gravou linha nelas ainda.
- `shop_items` está vazio — precisa de um seed (catálogo hoje só existe como mock,
  `mocks/fixtures/shopCatalog.ts`) antes da Loja fazer sentido de verdade.
- Fechamento semanal de liga (TDD §6) é um job agendado, não parte do request síncrono — pode ficar
  pra depois; o endpoint `GET /league` só precisa *ler* o estado atual, não fechar liga sozinho.
- Tamanho: médio — é o maior bloco de trabalho pendente aqui, mas nada arquiteturalmente novo.

### 3. Perfil completo (`/perfil`) — conquistas e resumo de progresso
- `GET /v1/progress/summary` — stub em `internal/learning/learning.go`.
- Depende também do item 2 (`GET /v1/gamification/me` traz `achievements`).
- `ProgressSummary` (tracks em andamento/concluídas, lições concluídas últimos 7 dias, taxa de
  acerto) dá pra calcular com queries sobre `user_progress`/`practice_sessions` (MongoDB) — não
  precisa de tabela nova.

### 4. Notificações (`/notificacoes`)
- `GET /v1/notifications`, `PATCH /v1/notifications/preferences` — stub em
  `internal/notifications/notifications.go`.
- Nenhuma tabela/coleção desenhada ainda pra notificação — este é o item que precisa de mais
  desenho de schema antes de implementar (não é só "ligar o que já existe").

### 5. Modo Infinito (`/infinito/{topic}/sessao`)
- `POST /v1/infinite-mode/sessions`, `.../answers`, `.../end` — stub em `internal/learning/learning.go`.
- Decisão de escopo já tomada (`PENDENCIAS_IA.md` #7 antigo): reaproveita o pool de `questions`
  `approved` por `tracks.topic`, sem geração dedicada — a parte de IA não é o gargalo aqui, é só a
  rota HTTP que falta.

### 6. Materiais — Resumo Inteligente e Chat (`/materiais/{uploadId}/...`)
- `GET /v1/uploads/{id}/summary`, `POST/GET /v1/uploads/{id}/chat` — stub em `internal/learning/learning.go`.
- Depende da base de RAG que **já existe** (`content_chunks`, pgvector — ver ingestão real,
  `Docs/PENDENCIAS_IA.md` #1) mas ainda não tem consumidor pra resumo/chat, só pra geração de
  pergunta.
- Também depende do R2 estar habilitado (mesmo bloqueio de `PENDENCIAS_IA.md` #1) pra ter upload de
  material de verdade pra resumir/conversar sobre.

### 7. Explorar (`/explorar`) — listar meus materiais enviados
- `GET /v1/uploads` (listagem) **nem está no contrato da API Spec** — só existe
  `GET /v1/uploads/{id}` (um de cada vez). Precisa desenhar o endpoint de listagem antes de
  implementar (paginação, filtro por usuário).
- `initiateUpload`/`completeUpload`/`getUploadStatus` (criar/completar/consultar status de UM
  upload) já têm backend real (`POST /v1/uploads`, `.../complete`, `GET /v1/uploads/{id}` —
  ver `PENDENCIAS_IA.md`) — **deliberadamente não ativados aqui ainda** porque o upload de arquivo
  de verdade (`PUT` na URL pré-assinada) está bloqueado até o R2 ser habilitado na conta Cloudflare
  (`PENDENCIAS_IA.md` #1) — ativar só a metade que funciona criaria uma UX quebrada (upload começa,
  nunca termina).
- Pra ativar de vez: (a) resolver o bloqueio do R2, (b) desenhar e implementar `GET /v1/uploads`
  (listagem), (c) adicionar `"uploads"` em `NEXT_PUBLIC_API_REAL_RESOURCES`.

## Fora do escopo desta lista (telas de professor/admin)

Painel do Professor (`/painel`, `/revisao`) e Admin (`/admin`) também estão mockados
(`internal/analytics` stub, sem endpoint de diretório de usuários) — não estavam no pedido de
"telas da Maria", mas seguem o mesmo padrão: contrato documentado, handler faltando. Revisitar
quando alguém for de fato usar essas contas (Marina/Admin) além de teste manual.
