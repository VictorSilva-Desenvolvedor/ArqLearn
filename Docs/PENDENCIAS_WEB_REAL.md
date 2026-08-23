# Pendências — telas do app web ainda mockadas

> Registro de trabalho, no mesmo espírito de `PENDENCIAS_IA.md`: o que ficou real (auth real de
> verdade — Maria/Marina/Admin, `Docs/CLAUDE.md` §Stack) e o que continua mockado porque o backend
> por trás simplesmente ainda não existe. Cada item aqui é "endpoint(s) faltando", não "bug de
> frontend" — o lado `apps/web` já está pronto pra virar real assim que o backend existir (é só
> adicionar o nome do recurso em `NEXT_PUBLIC_API_REAL_RESOURCES`, ver `lib/api/config.ts`).
> Apagar cada item conforme for endereçado.

## O que já é real hoje (todas as telas da Maria — student)

Com auth real (Supabase, `apps/web/.env.local` →
`NEXT_PUBLIC_API_REAL_RESOURCES=users,tracks,lessons,users-write,gamification,progress,
infinite-mode,uploads-list,notifications,materials`):

- **Perfil básico e edição** — `GET/PATCH/DELETE /v1/users/me` (nome/e-mail/papel/XP/nível/streak/
  vidas/gems no GET; edição de perfil e apagar conta — soft-delete com prazo de graça LGPD — reais).
- **Trilhas e lições** — `GET /v1/tracks`, `GET /v1/tracks/{id}/lessons`.
- **Sessão de prática (quiz) completa** — iniciar sessão, responder pergunta (XP/vidas/streak
  atualizados de verdade via `internal/gamification/algorithms.go`), e **"Explique melhor"**
  (`POST .../questions/{id}/explain`, Groq).
- **Liga e Loja** — `GET /v1/gamification/me`, `GET /v1/gamification/league`,
  `POST /v1/gamification/streak/freeze`, `POST /v1/gamification/shop/purchase`. Liga usa uma liga
  bronze única por semana (sem particionamento por grupo <15 nem fechamento/promoção automática,
  TDD §6, ainda fora de escopo) — real mas simplificado, não mockado.
- **Perfil completo** — `GET /v1/progress/summary` (tracks em andamento/concluídas, lições últimos
  7 dias, taxa de acerto) e `achievements` via `GET /v1/gamification/me`.
- **Notificações** — `GET /v1/notifications`, `PATCH /v1/notifications/preferences`. Lista
  legitimamente vazia hoje: nenhum gatilho (streak em risco, promoção de liga etc.) escreve na
  coleção ainda — depende de job agendado que não existe (mesmo motivo de `cmd/worker` não
  consumir fila real).
- **Modo Infinito** — `POST /v1/infinite-mode/sessions`, `.../answers`, `.../end`.
- **Explorar — listagem de materiais enviados** — `GET /v1/uploads` (paginado).
- **Materiais — Resumo Inteligente e Chat** — `GET /v1/uploads/{id}/summary`,
  `POST/GET /v1/uploads/{id}/chat` (Groq, JSON mode, RAG sobre `content_chunks`). Real e testado
  ao vivo, mas **sem upload real de usuário até o R2 ser habilitado** (`Docs/PENDENCIAS_IA.md` #1)
  — a listagem de uploads (já real) fica vazia até lá, então a tela não é alcançável em produção
  ainda; não é uma limitação destes dois endpoints em si.
- Perguntas reais existem pra `track_s02_maquetes` (56+ aprovadas) — é a trilha certa pra testar o
  fluxo de prática de ponta a ponta com uma conta real.

## Paridade web/mobile — feature ausente no web (não é backend mockado)

Diferente do resto desta lista (que é sobre endpoint faltando), este item é sobre uma tela que
simplesmente não existe no lado web:

- **Cadastro de conta (`welcome`/`cadastro`)** — `apps/mobile` ganhou `app/welcome.tsx` e
  `app/cadastro.tsx` (commit `5c2b6d4`, 21/08/2026): tela de boas-vindas com "Começar agora" →
  formulário de cadastro chamando `AuthContext.signUp` (Supabase, com tratamento de confirmação de
  e-mail). `apps/web` não tem equivalente — `AuthContext.tsx` do web nem expõe um método `signUp`,
  e não existe rota `/cadastro` nem `/welcome`; `/login` é a única porta de entrada, então hoje um
  usuário novo só consegue criar conta pelo app mobile. Achado numa auditoria retroativa
  (ui-reviewer) de qualidade de frontend, não construído nesta passada por ser feature de escopo
  maior que uma correção de polish (precisa de decisão de fluxo/copy, não só réplica mecânica).

## Fora do escopo desta lista (telas de professor/admin)

Painel do Professor (`/painel`, `/revisao`) e Admin (`/admin`) também estão mockados
(`internal/analytics` stub, sem endpoint de diretório de usuários) — não estavam no pedido de
"telas da Maria", mas seguem o mesmo padrão: contrato documentado, handler faltando. Revisitar
quando alguém for de fato usar essas contas (Marina/Admin) além de teste manual.
