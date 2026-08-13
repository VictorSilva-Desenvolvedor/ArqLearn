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

### 1. Login real — validado via web+Playwright (item #5 tem os detalhes), falta device nativo
A Fase 0 foi verificada originalmente só por `tsc --noEmit`/`expo export --platform web` (smoke
tests de import/tipo). Na verificação real feita durante a Fase 4 (ver item #5, bloco
"Verificação real feita") o fluxo de login email/senha foi testado de ponta a ponta contra o
backend real (Supabase + `services/monolith` local) com uma conta real
(`maria.aluna@arqlearn.test`) — achou e corrigiu um bug real na guarda de rota pós-login (item #5,
bug 1). Isso foi via `expo start --web`, não device/emulador nativo — ainda falta: testar em
Android/iOS de verdade (Expo Go ou simulador), especialmente o caso de token expirando/renovando
em background (`AppState` + `startAutoRefresh`, comportamento que só existe no app nativo, não no
export web) e a criptografia real do `expo-secure-store` (Keychain/Keystore — no web ele nem tem
implementação, ver item #5).

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

### 5. Fase 4 — Explorar, Liga e Perfil (concluído, verificado ponta a ponta via web+Playwright)

**Verificação real feita** (não é device/simulador nativo, mas vai muito além de `tsc`/
`expo export`): `npx expo start --web` + Playwright headless, login de verdade com uma conta
Supabase real (`maria.aluna@arqlearn.test`) contra `services/monolith` rodando localmente
(Postgres real; MongoDB indisponível nesta máquina por credencial expirada no Atlas — sem relação
com este trabalho, `/v1/tracks` responde 503 e a Home mostra só o erro de bundler dev do Metro
quando isso acontece, não afeta Perfil/Liga/Explorar que não dependem de Mongo).
`expo-secure-store` não tem implementação web (`ExpoSecureStore.web.js` é um `export default {}`
vazio de propósito, nunca vai ter — SecureStore é nativo-only por design) — contornado só para
este teste com um shim local em `node_modules` (localStorage), revertido ao final; não é código
do app, não afeta native. Resultado: Perfil (stats/conquistas/streak, Configurações
editar+salvar), Liga (ranking real do bronze único, TDD §6 simplificado) e Explorar (busca, upload
prompt, grade de trilhas, `ThemeSelector` completo com as ~50 entradas do catálogo, seleção de
tema propagando pra `InfiniteModePromptCard`/badge "Selecionado") — todos renderizando e
funcionando com dados reais. Segue faltando o que só um device/emulador real cobre: comportamento
de `expo-secure-store`/AsyncStorage nativos de verdade (Keychain/Keystore), gestos touch nativos,
seletor de arquivo nativo (`expo-document-picker`), performance/memória reais.

Dois bugs reais encontrados e corrigidos nessa verificação (nenhum dos dois é específico de
Perfil/Liga/Explorar — afetavam o app inteiro, só nunca tinham sido pegos porque nada tinha
testado login ponta a ponta antes):

1. **Corrida na guarda de rota (`app/_layout.tsx`)** — o guard antigo era um `useEffect` +
   `router.replace()` imperativo comparando `usePathname()`. Mas o `<Stack/>` já montado não
   desmonta ao navegar (é a mesma instância trocando a tela ativa por conta própria, reagindo à
   navegação sem esperar o componente pai re-renderizar) — entre `router.replace("/")` no login e
   o efeito do pai redirecionar de volta, a rota protegida chegava a ficar ativa sem sessão e
   `useAuth()` derrubava a tela com "useAuth chamado sem sessão ativa" (reproduzido ao vivo).
   Trocado por `<Stack.Protected guard={...}>` (guarda declarativa do expo-router) — a tela
   protegida nem existe na árvore do navigator enquanto o guard for falso, sem frame
   intermediário pra derrubar. Precisou listar as rotas folha exatas (`trilhas/[trackId]/
   [lessonId]/sessao` etc.) em vez do nome da pasta — `<Stack.Screen name="trilhas">` sozinho não
   casa com nada e a tela fica inalcançável, silenciosamente (só um warning no console). `login.tsx`
   não navega mais manualmente após o login — o guard reage sozinho assim que `AuthContext` popula
   `user`.
2. **`TopAppBar`/`ThemeSelector` só existiam na Home** — igual ao web
   (`(shell)/layout.tsx` compartilha `TopAppBar` entre Home/Explorar/Liga/Perfil), mas no mobile só
   `(tabs)/index.tsx` incluía `<TopAppBar/>`; Explorar/Liga/Perfil ficavam sem o seletor de tema
   nem os stats do topo. Corrigido — as três telas agora incluem `<TopAppBar/>` também.

**Perfil.** Espelha
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
`types/api.ts`. `Button` ganhou variant `"danger"`.

**Liga.** Espelha
`apps/web/src/app/(shell)/liga/page.tsx` — header com tier atual (`trophy` + rótulo por
`league_tier`), aviso estático "Encerra em: 2d 14h 32m" (mesmo placeholder hardcoded do web —
fechamento semanal real ainda não existe, TDD §6 fora de escopo) e
`LeagueRankingList`/`LeagueRankRow`/`LeagueZoneBanner` (banners de zona de promoção/rebaixamento
nas posições 1 e `ranking.length - LEAGUE_DEMOTION_SLOTS + 1`, linha do usuário atual destacada).
Novo `getLeague` em `lib/api/resources/gamification.ts` + `mockLeague`/`LEAGUE_PROMOTION_SLOTS`/
`LEAGUE_DEMOTION_SLOTS` em `mocks/fixtures/gamification.ts` (porte direto do web).

**Explorar.** Fase 4 fechada por
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
conteúdo ainda (`hasContent: false`) — banner defensivo: como o `ThemeSelector` já desabilita
qualquer tema `hasContent: false` no picker (mesma regra do web), não tem caminho de UI normal
pra alcançar esse estado; mantido por paridade 1:1 com o web, não é código morto sem motivo.
Testado ao vivo (ver bloco "Verificação real" acima): busca, `ThemeSelector` completo (troca de
tema propaga pra `InfiniteModePromptCard` e pro badge "Selecionado"), upload prompt visível.
**Não testado nem ao vivo nem por device**: uma sessão de upload completa até "Pronto para
revisão" (precisa de um arquivo real + tempo de espera do polling) e o `AllDonePrompt` (precisa de
uma trilha 100% concluída, não dá pra alcançar isso rapidamente com uma conta nova).

### 6. Fase 5 — Loja, Notificações, Ajuda e Bugs (concluído, verificado ponta a ponta via web+Playwright)

Espelha `apps/web/src/app/(shell)/{loja,notificacoes,ajuda}/page.tsx`. Fecha o app mobile — não
sobra nenhuma tela em placeholder.

**Loja** (`app/loja.tsx`) — `ShopFeatureCard` (Recarga de Vidas/Bloqueio de Ofensiva,
`purchaseShopItem` já existia desde a Fase 1/`NoHeartsDialog`) e `ShopCosmeticItem` (grade 2
colunas, badge "Novo", estado bloqueado por nível). `mockShopCatalog` já estava portado desde a
Fase 0 (usado só pelo item de recarga de vidas até agora) — os `id` são os UUIDs reais de
`shop_items` (`migrations/0004_shop_items_seed`), não placeholders.

**Notificações** (`app/notificacoes.tsx`) — `NotificationList`/`NotificationItem` (ícone/cor por
`NotificationType`, destino clicável só em `streak_at_risk`, via `findCurrentLessonHref` — mesma
derivação "primeira lição em andamento" que a Home usa pro nó atual, novo
`lib/gamification/currentLesson.ts`) e `NotificationPreferencesPanel` (novo `Toggle` em
`components/ui/`, sem `<select>`/toggle nativo do RN — estilizado do zero espelhando o CSS do
web). Novo `lib/api/resources/notifications.ts`. Entrada nova: sino no `TopAppBar` (web esconde
esse ícone em viewport estreito via `hidden md:inline-flex` — no app nativo não existe essa noção
de viewport responsivo, então ficou sempre visível, adaptação deliberada, não um desvio do web).

**Ajuda e Bugs** (`app/ajuda.tsx`) — `HelpFaqSection` (conteúdo fixo, 6 perguntas) e
`BugReportForm` (alterna bug/sugestão, contador de caracteres, tipo/modelo de dispositivo só pra
bug, print opcional). Seletor de print usa `expo-document-picker` (mesmo pacote da Fase 4) +
`expo-file-system/legacy` (`readAsStringAsync` com encoding base64 — a API nova baseada em `File`
não tem um método de ler base64 direto, só `arrayBuffer()`/`bytes()`) pra montar o data URI que o
contrato espera (`screenshot_base64`), no lugar do `FileReader.readAsDataURL` do browser. Novo
`lib/api/resources/bugReports.ts` (só `submitBugReport` — `listBugReports`/`resolveBugReport` são
admin-only, fora de escopo do mobile, mesma decisão já registrada pra revisão de upload). Tipos
`AppNotification`/`NotificationType`/`BugReport`/`BugReportType`/`BugReportStatus`/`DeviceType`
adicionados a `types/api.ts` (faltavam completamente).

**Verificado ao vivo** (mesmo setup do item #5: `expo start --web` + Playwright + login real +
`services/monolith` local): Loja (preços/estado desabilitado por gemas insuficientes, badges),
Notificações (toggle push ligando/desligando independente do de e-mail, lista com item lido
esmaecido e não lido com indicador), Ajuda (troca bug↔sugestão, contador de caracteres, fluxo de
envio completo até a tela de confirmação). Achado e corrigido **1 bug real** nessa verificação: os
dois botões "Reportar bug"/"Sugerir melhoria" (`BugReportForm.tsx`) usavam `fullWidth` dentro de
um container `flexDirection: "row"` — no CSS do web isso encolhe pra caber (flex-shrink padrão é
1), mas no RN os itens de flex **não encolhem por padrão** (`flexShrink: 0`), então o segundo
botão vazava pra fora do card. Corrigido envolvendo cada botão num `View` com `flex: 1`. Não achei
esse padrão em nenhum outro lugar do app (só esse arquivo tinha dois botões `fullWidth` lado a
lado numa `row`; os demais usos de `fullWidth` empilham verticalmente, sem risco).
Print de bug (arquivo real via `expo-document-picker`/`expo-file-system`) não foi exercitado ao
vivo — mesma limitação de sempre, precisa de device/simulador nativo de verdade pro seletor de
arquivo nativo funcionar (aqui só valida a lógica/tipos).

### 7. Build de teste (EAS) — config pronta, falta rodar (precisa da conta Expo do usuário)
Com a Fase 5 fechada, o que faltava de escopo "nova tela" acabou. Preparado nesta sessão, tudo
local e reversível: `apps/mobile/eas.json` (perfis `development`/`preview`/`production`, canal
`preview` pra build de teste) e `app.json` ganhou `ios.bundleIdentifier`/`android.package`
(`com.arqlearn.mobile`, mesmo domínio já usado em `api.arqlearn.com` na API Spec) — os dois são
obrigatórios pro EAS gerar um binário nativo de verdade, e nenhum dos dois existia antes.

**Não dá pra ir além disso sem a conta Expo do usuário** — `eas login` (autenticação real, não é
algo pra rodar por conta própria) e depois `eas init` (linka o projeto a um `projectId`, grava em
`app.json` → `extra.eas.projectId`) precisam rodar interativamente com a sessão de quem tem (ou
vai criar) a conta. Depois disso, `eas build --platform android --profile preview` já funciona
sem exigir mais nada pago (EAS gera o keystore Android sozinho); iOS precisa de conta Apple
Developer (US$99/ano) além da conta Expo, mesmo só pra build de teste via `TestFlight`/interno.
Ação necessária: `npx eas login` (ou `eas-cli` global) na máquina de quem for rodar, depois
`eas init`, depois `eas build --platform android --profile preview` como primeiro build de teste.
