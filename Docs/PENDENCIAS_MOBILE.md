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
quando uma trilha termina) — **portados na Fase 4** (ver item #5 abaixo). Verificado só por
`tsc --noEmit` (limpo) e
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
precisa de `expo-document-picker`, ainda não instalado) — **portado na Fase 4** (ver item #5
abaixo) — e a revisão de perguntas do professor (`listUploadQuestions`/`reviewUploadQuestion`,
fora de escopo do mobile por decisão já registrada, permanece de fora).
Verificado só por `tsc --noEmit` (limpo) e `expo export --platform web` (bundla sem erro) — mesma
limitação dos itens #1-#3: login sempre Supabase real, não dá pra validar ponta a ponta sem
device/simulador + conta real. Ação necessária: `npx expo start`, abrir Explorar → seção "Meus
Materiais" → tocar em "Sistemas Construtivos" (PDF), conferir Resumo (sinopse, card de diagrama
placeholder, pontos-chave, dica do arquiteto), "Tirar Dúvidas" → enviar pergunta com "modulação"
(deve citar página 14) e uma genérica (página 12), conferir que o histórico seedado aparece ao
entrar; tocar em "Planta Baixa Residencial" (imagem, sem histórico) e conferir que abre limpo.

### 5. Fase 4 — Explorar, Liga e Perfil (concluído, pendente de teste em device real)

**Perfil concluído, mas nunca testado num device/simulador de verdade.** Espelha
`apps/web/src/app/(shell)/perfil/{page.tsx,configuracoes/page.tsx}` — sem o ramo de professor/
admin do web (fora de escopo do mobile). `perfil.tsx` (tab) ganhou `ProfileHeader` (avatar, nível/
título, barra de XP), `ProfileStatsGrid`, `ProgressSummaryCard` (novo resource
`lib/api/resources/progress.ts` + `getProgressSummary`), `StreakFreezeCard` (novo `freezeStreak`
em `lib/api/resources/gamification.ts`), `AchievementGrid`/`AchievementBadge` (reaproveita
`lib/gamification/achievementCatalog.ts`, já portado nas fases anteriores) e o menu
(`ProfileMenuLink`/`LogoutMenuLink`) com "Loja"/"Ajuda e Bugs" como "Em breve" (Fase 5) e
"Configurações" real. Nova rota `app/perfil/configuracoes.tsx` — edição de nome/fuso horário
(novo resource `lib/api/resources/profile.ts`, `updateMe`/`deleteMe`, gated por
`users-write` como no web) e exclusão de conta com confirmação por frase + hold-to-confirm de
10s (`Pressable` `onPressIn`/`onPressOut`, sem equivalente RN de `onPointerDown`/`onPointerUp`).
Novo `lib/gamification/levelTitle.ts` (porte direto do web) e tipo `ProgressSummary` adicionado a
`types/api.ts`. `Button` ganhou variant `"danger"`. Verificado só por `tsc --noEmit` (limpo) e
`expo export --platform web` (bundla sem erro) — mesma limitação dos itens #1-#4: login sempre
Supabase real, não dá pra validar ponta a ponta sem device/simulador + conta real. Ação
necessária: `npx expo start`, abrir a aba Perfil, conferir XP/nível/streak/gemas/conquistas reais,
usar bloqueio de ofensiva (se disponível), abrir Configurações → editar nome/fuso e salvar, e
testar o fluxo de exclusão de conta (digitar a frase, segurar o botão 10s, conferir a tela de
"exclusão agendada").

**Liga concluída, mas nunca testada num device/simulador de verdade.** Espelha
`apps/web/src/app/(shell)/liga/page.tsx` — header com tier atual (`trophy` + rótulo por
`league_tier`), aviso estático "Encerra em: 2d 14h 32m" (mesmo placeholder hardcoded do web —
fechamento semanal real ainda não existe, TDD §6 fora de escopo) e
`LeagueRankingList`/`LeagueRankRow`/`LeagueZoneBanner` (banners de zona de promoção/rebaixamento
nas posições 1 e `ranking.length - LEAGUE_DEMOTION_SLOTS + 1`, linha do usuário atual destacada).
Novo `getLeague` em `lib/api/resources/gamification.ts` + `mockLeague`/`LEAGUE_PROMOTION_SLOTS`/
`LEAGUE_DEMOTION_SLOTS` em `mocks/fixtures/gamification.ts` (porte direto do web). Verificado só
por `tsc --noEmit` (limpo) e `expo export --platform web` (bundla sem erro) — mesma limitação dos
itens anteriores: login sempre Supabase real, não dá pra validar ponta a ponta sem device/
simulador + conta real. Ação necessária: `npx expo start`, abrir a aba Liga, conferir tier/
ranking reais e os banners de promoção/rebaixamento.

**Explorar concluído, mas nunca testado num device/simulador de verdade.** Fase 4 fechada por
completo — sem placeholder restante. Espelha `apps/web/src/app/(shell)/explorar/page.tsx`:
`SearchBar` (filtra trilhas recomendadas e "Meus Materiais" pelo mesmo campo de busca),
`UploadPromptCard` (upload de verdade via `expo-document-picker`, instalado nesta fase —
`initiateUpload`/`completeUpload`/`getUploadStatus` portados para `lib/api/resources/uploads.ts`,
com polling a cada 700ms até status terminal, mesma simulação de pipeline assíncrono do web em
`mocks/fixtures/uploadProcessing.ts`; sem PUT de bytes pro `upload_url` — nem o web faz isso hoje,
R2 ainda não habilitado, ver `Docs/PENDENCIAS_IA.md` #1 e memória do projeto), `TrackCard` (grade
"Trilhas Recomendadas" a partir de `mocks/fixtures/exploreTracks.ts`, portado junto com as 4
trilhas que faltavam em `mocks/fixtures/tracks.ts` pra ter paridade com o web) e
`UploadedContentItem` (substitui a listagem antiga da Fase 3). `InfiniteModePromptCard` liga o
tema selecionado ao Modo Infinito.

Inclui os dois itens que tinham ficado deliberadamente de fora da Fase 2 por dependerem desta
fase: `ThemeContext` — porte adaptado (sem cookie/SSR/`router.refresh`, que não existem no RN;
persiste em AsyncStorage, ver `contexts/ThemeContext.tsx`) — e `ThemeSelector`
(`components/home/ThemeSelector.tsx`, um `Modal` com lista rolável por semestre substituindo o
dropdown do web, que não tem equivalente nativo direto; acionado a partir de um novo item no
`TopAppBar`). O catálogo de temas (`mocks/fixtures/themes.ts`) trocou o campo `icon` de string
livre (Material Symbols, só do web) para `IconName` do RN — precisou de ~35 glifos novos em
`components/ui/Icon.tsx` (prefixo `theme*`) pra cobrir as quase 50 entradas sem cair num ícone
genérico. Também inclui `AllDonePrompt` no Home (`components/home/AllDonePrompt.tsx` — sem
`sessionStorage` no RN, dispensa fica num `Set` em memória de módulo, que reseta sozinho ao
reabrir o app, mesmo efeito prático de uma aba nova no navegador) e a integração do tema
selecionado na Home (`(tabs)/index.tsx`): trilha em destaque vem primeiro, primeira lição vira
"atual" se a trilha ainda não tem progresso, e um aviso aparece quando o tema escolhido não tem
conteúdo ainda (`hasContent: false`). Verificado só por `tsc --noEmit` (limpo) e
`expo export --platform web` (bundla sem erro) — mesma limitação dos itens #1-#4: login sempre
Supabase real, não dá pra validar ponta a ponta sem device/simulador + conta real. Ação
necessária: `npx expo start`, testar busca (trilhas e materiais), trocar de tema pelo
`ThemeSelector` (incluindo um tema sem conteúdo, pra ver o aviso na Home e o card do Modo
Infinito atualizando), fazer um upload real de um arquivo pequeno e acompanhar o polling até
"Pronto para revisão", e completar uma trilha em destaque pra ver o `AllDonePrompt` na Home.

### 6. Fase 5 — Loja, Notificações, Ajuda e Bugs
Ausentes por completo no mobile (nem placeholder existe) — espelhar
`apps/web/src/app/(shell)/{loja,notificacoes}/page.tsx` e a tela de Ajuda e Bugs do web.

### 7. Build de teste (EAS) ainda não gerado
`apps/mobile` não tem `eas.json` — decisão do usuário foi terminar as telas (pendências #2-#6)
antes de gerar qualquer build de teste. Retomar essa conversa só depois.
