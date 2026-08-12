# Pendências — app mobile (`apps/mobile`)

> Registro de trabalho, no mesmo espírito de `PENDENCIAS_IA.md`/`PENDENCIAS_WEB_REAL.md`: o que já
> ficou pronto no app mobile e o que continua faltando pra chegar em paridade com `apps/web`. Plano
> completo (fases, arquivos de referência no web a espelhar) em
> `Docs/stitch_app_visual_identity/` não se aplica aqui — o plano vivo é o que orientou a Fase 0
> (PR #44); as fases seguintes devem seguir a mesma lógica de "espelhar o padrão do web pro RN".
> Apagar cada item conforme for endereçado.

## O que já é real hoje (Fase 0 — fundação, PR #44)

- **Auth real (Supabase)** — client RN com sessão criptografada (`expo-secure-store` +
  `AsyncStorage`, padrão oficial Supabase pra Expo), `AuthContext` sem a metade mock-cookie de
  professor/admin (fora de escopo no mobile, decisão do usuário), guarda de rota client-side em
  `app/_layout.tsx`, tela de login em `app/login.tsx`.
- **Camada `lib/api`** (`config`/`http`/`resources`/`mocks`) espelhando `apps/web`, cobrindo
  `users`, `gamification`, `tracks`, `lessons` — mesmo toggle mock/real por
  `EXPO_PUBLIC_API_REAL_RESOURCES`.
- **Hooks e primitivos de UI** que faltavam: `useCountdown`/`useCountdownToTimestamp`,
  `useLessonDownload` (AsyncStorage), `useToast`, `Modal`, `Toast`, `IconButton`, `ErrorBanner`.
- **Home** busca tracks/lessons pela API real em vez de mocks importados direto.

## Fora do escopo do mobile (decisão do usuário)

Painel do Professor e área Admin (revisão de bugs) **não entram no app mobile** — ficam só no web.
Mobile foca 100% na experiência do aluno.

## Pendências

### 1. Login real não validado num device/simulador de verdade
A Fase 0 foi verificada só por `tsc --noEmit` (limpo) e `expo export --platform web` (bundla sem
erro) — os dois são smoke tests de import/tipo, não confirmam que o fluxo de login
email/senha funciona de ponta a ponta contra o backend real (Supabase + `services/monolith`) num
dispositivo físico ou emulador Android/iOS. Ação necessária: abrir o app (`npx expo start` em
`apps/mobile`, Expo Go ou simulador) e testar login com uma conta real (ex. `maria.aluna@...`),
incluindo o caso de token expirando/renovando em background (`AppState` + `startAutoRefresh`).

### 2. Fase 1 concluída, mas nunca testada num device/simulador de verdade
`useQuizSession` foi portado (`src/components/features/quiz/`), com telas de sessão/resumo/
conquista em `app/trilhas/[trackId]/[lessonId]/`, os componentes de quiz (`QuestionCard`,
`AnswerOption`, `FillBlankInput`, `QuizActionBar`, `HeartsRow`, `QuizHeader`) e os modais de
gamificação (`NoHeartsDialog`, `HeartsCountdown`, `LevelUpCelebration`, este último montado
globalmente em `app/_layout.tsx`). Verificado só por `tsc --noEmit` (limpo) e
`expo export --platform web` (bundla 1056 módulos sem erro) — mesma limitação já registrada no
antigo item #1 desta lista: como login é sempre Supabase real (nunca mockado), não dá pra validar
o fluxo ponta a ponta sem device/simulador + conta real. Ação necessária: `npx expo start` em
`apps/mobile`, logar com conta real, abrir uma lição da trilha `t2-l1` (banco de perguntas Gótico,
cobre os 5 tipos de pergunta) e percorrer: responder certo/errado, "Explique melhor", zerar vidas
(`NoHeartsDialog` + restaurar com gemas), completar com 100% de acerto (tela de conquista credita
XP/gemas uma única vez), e forçar um level-up (`LevelUpCelebration` global).

### 3. Fase 2 — Modo Infinito
Ausente. Precisa `useInfiniteModeSession` portado de
`apps/web/src/components/features/infiniteMode/`, telas em `app/infinito/[topic]/`, reaproveitando
`QuestionCard` da Fase 1.

### 4. Fase 3 — Materiais (Chat e Resumo)
Ausente. Precisa telas em `app/materiais/[uploadId]/{chat,resumo}`, componentes de
`components/features/{materialSummary,materialChat}/`, e completar
`lib/api/resources/materials.ts` no mobile.

### 5. Fase 4 — Explorar, Liga e Perfil ainda são placeholder
`explorar.tsx`/`liga.tsx`/`perfil.tsx` são telas estáticas de "em construção" — precisam virar
reais, espelhando `apps/web/src/app/(shell)/{explorar,liga,perfil}/page.tsx`.

### 6. Fase 5 — Loja, Notificações, Ajuda e Bugs
Ausentes por completo no mobile (nem placeholder existe) — espelhar
`apps/web/src/app/(shell)/{loja,notificacoes}/page.tsx` e a tela de Ajuda e Bugs do web.

### 7. Build de teste (EAS) ainda não gerado
`apps/mobile` não tem `eas.json` — decisão do usuário foi terminar as telas (pendências #2-#6)
antes de gerar qualquer build de teste. Retomar essa conversa só depois.
