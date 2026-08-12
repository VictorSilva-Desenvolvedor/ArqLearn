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

### 3. Fase 2 concluída, mas nunca testada num device/simulador de verdade
`useInfiniteModeSession` foi portado (`src/components/features/infiniteMode/`), com telas em
`app/infinito/[topic]/{sessao,resumo}.tsx`, reaproveitando `QuestionCard`/`AnswerOption`/
`FillBlankInput` da Fase 1 e `StatCard` do resumo de lição. Componentes próprios:
`InfiniteModeActionBar`, `InfiniteModeHeader`, `InfiniteModeSummaryPanel` — level-up aqui é um
toast (`useToast`), não o modal `LevelUpCelebration` da Fase 1. Ponto de entrada: seção "Modo
Infinito" adicionada à tela `explorar.tsx` (ainda um placeholder no resto — busca/upload continuam
"em construção"), listando `themeCatalog` (portado em `lib/api/mocks/fixtures/themes.ts`, ~44
temas) sem filtrar por `hasContent`; um tema sem banco cai na tela "ainda não está pronto" da
própria sessão. **Não portados** (fora de escopo, ficam pra Fase 4 — Explorar/Home reais):
`ThemeContext` (seleção de tema global) e `AllDonePrompt` (modal do Home oferecendo Modo Infinito
quando uma trilha termina). Verificado só por `tsc --noEmit` (limpo) e
`expo export --platform web` (bundla sem erro) — mesma limitação dos itens #1/#2: login sempre
Supabase real, não dá pra validar ponta a ponta sem device/simulador + conta real. Ação necessária:
`npx expo start`, abrir Explorar → tocar num tema com banco (ex. `fundamentos`), responder
perguntas, testar "Desistir" (encerra na hora, sem diálogo), esgotar o banco mock (9 perguntas) e
cair no resumo automaticamente; tocar num tema sem banco (ex. `arquitetura_brasileira`) e conferir
a tela "ainda não está pronto".

### 4. Fase 3 concluída, mas nunca testada num device/simulador de verdade
`materials.ts` foi portado (`getUploadSummary`/`listChatHistory`/`sendChatMessage`), com telas em
`app/materiais/[uploadId]/{resumo,chat}.tsx` e os componentes de `components/features/
materialSummary/` (`SummaryHeader`, `DiagramCard`, `KeyPointsChecklist`, `ArchitectTipCallout`) e
`components/features/materialChat/` (`useMaterialChat`, `ChatInputBar`, `ChatMessageBubble`) —
diferente do web, que inlina a lógica de chat direto na página, aqui ficou num hook colocado na
pasta da feature, mesma convenção das Fases 1/2. Sem streaming (chat é request/response simples).
Ponto de entrada: seção "Meus Materiais" na tela `explorar.tsx`, listando `listMyUploads()` (só
`uploads.ts` parcial — `listMyUploads`/`fileTypeFromMime`). **Não portados** (fora de escopo,
ficam pra Fase 4 junto com o Explorar real): o fluxo de upload de verdade
(`initiateUpload`/`completeUpload`/`getUploadStatus`, polling de status, seletor de arquivo —
precisa de `expo-document-picker`, ainda não instalado) e a revisão de perguntas do professor
(`listUploadQuestions`/`reviewUploadQuestion`, fora de escopo do mobile por decisão já registrada).
Verificado só por `tsc --noEmit` (limpo) e `expo export --platform web` (bundla sem erro) — mesma
limitação dos itens #1-#3: login sempre Supabase real, não dá pra validar ponta a ponta sem
device/simulador + conta real. Ação necessária: `npx expo start`, abrir Explorar → seção "Meus
Materiais" → tocar em "Sistemas Construtivos" (PDF), conferir Resumo (sinopse, card de diagrama
placeholder, pontos-chave, dica do arquiteto), "Tirar Dúvidas" → enviar pergunta com "modulação"
(deve citar página 14) e uma genérica (página 12), conferir que o histórico seedado aparece ao
entrar; tocar em "Planta Baixa Residencial" (imagem, sem histórico) e conferir que abre limpo.

### 5. Fase 4 — Explorar, Liga e Perfil ainda são placeholder
`explorar.tsx`/`liga.tsx`/`perfil.tsx` são telas estáticas de "em construção" — precisam virar
reais, espelhando `apps/web/src/app/(shell)/{explorar,liga,perfil}/page.tsx` (`explorar.tsx` já
ganhou uma seção de Modo Infinito na Fase 2 e "Meus Materiais" na Fase 3, mas segue sem busca/
trilhas recomendadas). Inclui portar `ThemeContext` (seleção de tema global, hoje só no web) e, no
Home, `AllDonePrompt` (modal oferecendo Modo Infinito quando a trilha em destaque termina) — os
dois ficaram deliberadamente fora da Fase 2 por dependerem desta fase. Também inclui o fluxo de
upload de verdade (`UploadPromptCard`, seletor de arquivo via `expo-document-picker` — ainda não
instalado —, `initiateUpload`/`completeUpload`/`getUploadStatus` de `lib/api/resources/uploads.ts`,
polling de status), deixado fora da Fase 3 pelo mesmo motivo.

### 6. Fase 5 — Loja, Notificações, Ajuda e Bugs
Ausentes por completo no mobile (nem placeholder existe) — espelhar
`apps/web/src/app/(shell)/{loja,notificacoes}/page.tsx` e a tela de Ajuda e Bugs do web.

### 7. Build de teste (EAS) ainda não gerado
`apps/mobile` não tem `eas.json` — decisão do usuário foi terminar as telas (pendências #2-#6)
antes de gerar qualquer build de teste. Retomar essa conversa só depois.
