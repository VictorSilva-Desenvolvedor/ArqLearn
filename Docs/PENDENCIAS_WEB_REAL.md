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

## Classe de tamanho em `<Icon>` não tem efeito nenhum no web (aberto em 2026-08-25, ui-reviewer)

**Medido ao vivo, não inferido:** na tela de Conquista, um `<Icon className="text-6xl">` (60px)
computa `font-size: 24px`. O mesmo vale para `text-5xl`, `text-3xl`, `text-2xl` e `text-xl` — todo
ícone do web renderiza em 24px, independentemente da classe.

**Causa:** a folha do Material Symbols (carregada por `<link>` em `src/app/layout.tsx`) define
`.material-symbols-outlined { font-size: 24px }` **fora de qualquer cascade layer**. No Tailwind v4
as utilities vivem em `@layer utilities`, e em CSS moderno **estilo não-layered sempre vence estilo
layered**, independente de especificidade ou ordem. Então a regra do Google ganha de `text-6xl`
sempre.

**Alcance:** 98 ocorrências em 46 arquivos (`grep -rn "Icon" apps/web/src --include=*.tsx | grep -E
'className="[^"]*text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)'`). É boa parte da diferença de
"peso visual" entre as telas implementadas e as referências do Stitch.

**Correção recomendada (não aplicada nesta rodada):** trocar o `<link>` do Material Symbols por um
`@import url(...) layer(vendor);` em `globals.css`, com `@layer vendor, theme, base, components,
utilities;` declarado antes — isso põe o CSS do Google numa layer de menor prioridade e faz as 98
ocorrências voltarem a funcionar de uma vez. **Não foi feito aqui de propósito:** a mudança altera o
tamanho de ícone em ~46 arquivos simultaneamente e exige re-auditoria visual de todas as telas do
app, o que não cabia no orçamento de uma rodada de varredura. Enquanto isso não acontece, a saída
local é a prop `size` do próprio componente (`<Icon size={56} />`), que aplica `font-size` inline e
por isso vence — foi o que se usou nas telas C, D e E.

## Progresso do módulo no Resumo da Lição — RESOLVIDO em 2026-08-25

Era `moduleProgressPercent={75}` literal. Decisão do usuário: calcular de verdade. Agora busca
`GET /v1/tracks/{track_id}/lessons` e mostra lições concluídas / total da trilha. Detalhe: vira
progresso da trilha inteira, não de uma "unidade" — a API não expõe unidade por lição. Ver
`Docs/UI_AUDIT_STATUS.md` pendência #3 pro detalhe completo. Mesmo fix no mobile
(`Docs/PENDENCIAS_MOBILE.md`).

## Fila de Revisão do Painel: coluna "Ação" fora da tela em 390px (aberta em 2026-08-25)

Achado na auditoria visual da rodada 5 (`Docs/UI_AUDIT_STATUS.md`), ao verificar o novo filtro por
tópico de "Revisar Módulo".

`ReviewQueueTable.tsx` é uma `<table>` de 5 colunas (Aluno, Questão ID, Tópico, Status, Ação) dentro
de um wrapper `overflow-x-auto`. Numa viewport de 390px as três primeiras colunas já consomem a
largura toda: "Status" aparece cortado e a coluna **"Ação" — que contém o link "Revisar", a única
ação por linha da tela — fica inteiramente fora do campo visível**. O conteúdo é alcançável (o
wrapper rola de fato na horizontal), mas não há nenhuma affordance de que exista algo à direita:
sem sombra de borda, sem gradiente, sem indicador.

**Por que piorou agora:** desde que "Revisar Módulo" passa a rolar a página automaticamente até essa
tabela, ela virou o destino de um fluxo explícito do professor, e não mais uma seção que ele
encontra rolando. O caminho "vi um tópico fraco → quero revisar as questões dele" termina numa
tabela cujo botão de revisar não aparece.

**Não corrigido de propósito:** as duas saídas razoáveis (a — virar lista de cards abaixo de `sm`,
como já se fez em outras telas; b — manter a tabela e adicionar indicador de rolagem) são decisões
de design com consequências diferentes pro resto do Painel, não uma correção objetiva. Escolha do
usuário.

## Fila de Revisão do Painel: mock tem um único tópico (aberta em 2026-08-25)

Também da rodada 5. O filtro por tópico foi corrigido no mock pra que o caminho feliz exista (antes,
nenhum `weak_topic` casava com nenhuma linha da fila e **todo** clique caía no estado vazio — ver
`Docs/UI_AUDIT_STATUS.md`, rodada 5). Mas as 4 linhas de `mockReviewQueue` continuam sendo todas do
mesmo tópico ("Introdução ao BIM"), então filtrar por ele mostra a fila inteira: dá pra provar que o
filtro **exclui** (pelo estado vazio do 2º tópico), não que ele **estreita**.

Fechar isso exige um segundo upload em `mockReviewQuestions` + `mockReviewTrackTitle` (12 perguntas
novas, no molde do `upload-bim-intro`), porque cada linha da fila leva a `/revisao/{upload_id}` —
inventar um `upload_id` só pra variar o tópico criaria um link quebrado, que é pior que a limitação
atual.
