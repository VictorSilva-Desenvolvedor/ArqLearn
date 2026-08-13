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

### 2. Fase 1 (quiz) — verificado ao vivo, sem bugs encontrados
`useQuizSession` (`src/components/features/quiz/`), telas de sessão/resumo/conquista em
`app/trilhas/[trackId]/[lessonId]/`, componentes de quiz (`QuestionCard`, `AnswerOption`,
`FillBlankInput`, `QuizActionBar`, `HeartsRow`, `QuizHeader`) e os modais de gamificação
(`NoHeartsDialog`, `HeartsCountdown`, `LevelUpCelebration`, montado globalmente em
`app/_layout.tsx`). **Bloqueio de MongoDB resolvido em 13/08/2026** (senha do Atlas estava
desatualizada em `services/monolith/.env` — usuário forneceu a senha nova, ver memória do
projeto) — isso desbloqueou a verificação ao vivo desta fase, que precisa de `tracks`/`lessons`/
perguntas reais (diferente das Fases 2/3, mockadas).

**Verificado ao vivo** (`expo start --web` + Playwright + login real + `services/monolith`
local): troquei o tema selecionado pra "Construções Sustentáveis" (fazendo a Home destacar a
primeira lição da trilha como "Em andamento", já que a conta de teste não tinha progresso nela
ainda), abri a lição de verdade
(`track_s01_construcoes_sustentaveis/lesson_construcoes_sustentaveis_u3_p1`) e respondi 10
perguntas reais (geradas via Gemini, revisadas via `cmd/review-questions`, sobre o texto de
Construções Sustentáveis Unidade 3) — mistura de certo/errado, vidas descontadas nas erradas,
"Explique melhor" funcionando de ponta a ponta com resposta real do Groq (destaque da opção
certa + explicação curta + aprofundamento). Cheguei em "Lição Concluída!" com XP/precisão/
sequência/vidas reais (90% de precisão, +255 XP, "Progresso do módulo 75%" — a lição é 1 de 4
partes da Unidade 3, ver `seeds/004_divide_novas_materias_em_licoes_de_10.js` em
`PENDENCIAS_IA.md`), e "Continuar para o Mapa" voltou pra Home corretamente. Nenhum erro de
console em nenhum passo. **Nenhum bug encontrado.**

**Não testado ao vivo** (não fui atrás de propósito — exigiria forçar erros/progresso específico
numa conta compartilhada de teste): zerar vidas até aparecer o `NoHeartsDialog` e restaurar com
gemas, completar uma lição com 100% de acerto pra ver a tela de conquista (distinta do resumo
normal, credita XP/gemas uma única vez), e forçar um level-up (`LevelUpCelebration`). Continua
precisando de device/simulador nativo real pra cobrir o que o `expo start --web` não alcança
(gestos, `SecureStore` nativo).

### 3. Fase 2 (Modo Infinito) — verificado ao vivo, sem bugs encontrados
`useInfiniteModeSession` (`src/components/features/infiniteMode/`), telas em
`app/infinito/[topic]/{sessao,resumo}.tsx`, reaproveitando `QuestionCard`/`AnswerOption`/
`FillBlankInput` da Fase 1. `infinite-mode` **não** está em `EXPO_PUBLIC_API_REAL_RESOURCES` —
usa banco de perguntas mock, sem depender do MongoDB (por isso deu pra verificar mesmo com o
Mongo fora do ar nesta máquina, diferente do item #2). **Verificado ao vivo** (`expo start --web`
+ Playwright + login real, mesmo setup dos itens #5/#6): abri `fundamentos` (tema com banco),
respondi 3 perguntas (opção certa destacada em verde, XP creditado até bater o teto diário —
aviso apareceu corretamente), toquei "Desistir" e caí direto no resumo com as estatísticas exatas
de quem tinha respondido até ali (3 questões, 100% precisão, +20 XP) — sem diálogo de confirmação,
como o comportamento documentado exige. Nenhum bug encontrado. **Não testado ao vivo**: um tema
sem banco (`hasContent: false`) caindo na tela "ainda não está pronto" — não teria como acontecer
via UI normal de qualquer forma, ver nota no item #5 sobre o `ThemeSelector` desabilitar esses
temas no picker.

### 4. Fase 3 (Materiais) — verificado ao vivo, sem bugs encontrados
`materials.ts` (`getUploadSummary`/`listChatHistory`/`sendChatMessage`), telas em
`app/materiais/[uploadId]/{resumo,chat}.tsx`. `materials` **também não** está em
`EXPO_PUBLIC_API_REAL_RESOURCES` — mock, sem depender do MongoDB, mesmo motivo do item #3.
**Verificado ao vivo**: abri o Resumo Inteligente de "Sistemas Construtivos" (sinopse, card de
diagrama placeholder, 3 pontos-chave, dica do arquiteto) e o Chat — o histórico seedado (pergunta
sobre concreto vs. aço) apareceu certo ao entrar; mandei "O que é modulação?" e a resposta mock
voltou citando a página certa ("Página 14") com a citação exata do documento, exatamente como o
mock descreve. Abri também "Planta Baixa Residencial" (imagem, sem histórico) — abriu limpo, sem
nenhum resquício do outro material. Nenhum bug encontrado.

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

### 7. Build de teste — Android via APK — CONCLUÍDO (13/08/2026); iOS fora de escopo por enquanto
Decisão do usuário: iOS não entra no escopo por enquanto — só Android, testado via APK. Isso é
mais barato de validar que iOS (sem exigir conta Apple Developer paga) e é o caminho natural pra
um primeiro teste real fora do smoke test de bundler.

Preparado nesta sessão, tudo local e reversível: `apps/mobile/eas.json` (perfis
`development`/`preview`/`production`; `preview` gera APK — `android.buildType: "apk"` — em vez do
AAB padrão, que não instala direto num aparelho sem passar pela Play Store) e `app.json` ganhou
`ios.bundleIdentifier`/`android.package` (`com.arqlearn.mobile`, mesmo domínio já usado em
`api.arqlearn.com` na API Spec) — obrigatórios pro EAS gerar um binário nativo de verdade.

**Tentativa de build 100% local (sem EAS/conta nenhuma) — bloqueada por uma limitação real do
Windows, não por falta de ferramenta.** A máquina já tinha Android Studio + SDK completo (API 36,
NDK 27, build-tools) e JDK 21 (JBR do Android Studio) instalados, então rodei
`npx expo prebuild --platform android` + `gradlew assembleDebug` direto, sem precisar de EAS.
Chegou a compilar boa parte das dependências nativas (react-native-screens, reanimated,
expo-modules-core...), mas travou comilando `react-native-worklets` (dependência nativa do
Reanimated): o compilador C++ do NDK (`clang++`/`ninja`, toolchain do Android para Windows) não
consegue abrir um header num caminho com caracteres não-ASCII —
`D:\Programação\ArqLearn\ArqLearn` tem "ç"/"ã", e o clang do NDK claramente lê esse trecho do
caminho com a codepage errada (`Programa<E7><E3>o` no log, mojibake clássico de ANSI vs UTF-8).
`android.overridePathCheck=true` (sugerido pelo próprio Gradle) contorna só o *aviso* do AGP, não
o erro real do compilador. Isso é uma limitação conhecida do NDK/clang no Windows com caminho
não-ASCII, não um bug do projeto — **não mexi na pasta do repositório** (só quem usa a máquina
deve decidir mover/renomear algo assim). A pasta `android/` gerada foi apagada de novo no final
(local, sem afetar o repo — `/android` já está no `.gitignore`).

**Isso não bloqueia o build de teste, só descarta a rota 100% local nesta máquina**: o build em
nuvem do EAS roda em container Linux (paths ASCII, sem esse problema) — segue sendo o caminho
viável, só que precisa da conta Expo do usuário (`eas login`, autenticação real, não é algo pra
rodar por conta própria) e depois `eas init` (linka o projeto a um `projectId`, grava em
`app.json` → `extra.eas.projectId`). Depois disso, `eas build --platform android --profile
preview` já funciona sem exigir nada pago (EAS gera o keystore Android sozinho).
**Feito**: usuário forneceu um Personal Access Token da conta Expo (`victor-silvadevs-team`) e o
`projectId` de um projeto EAS já existente (`692aff4e-c78b-45dc-8957-fba9351a8ec6`) — usado só
como `EXPO_TOKEN` na sessão, nunca gravado em arquivo do repo. `eas init --id ... --non-interactive`
precisou de `slug` em `app.json` batendo com o slug já registrado no projeto EAS
(`victorsilva-dev` — divergia de `mobile`, corrigido).

**Primeiro build (perfil `preview`) rodou e instalou, mas o app abria e crashava na hora** — causa
raiz: o build não tinha NENHUMA variável de ambiente configurada (log confirmou: "No environment
variables ... found for the 'preview' environment on EAS"). `.env.local` só vale pro `expo start`
local — nunca é lido pelo build em nuvem. Sem `EXPO_PUBLIC_SUPABASE_URL`/chave, o `createClient`
do Supabase (`lib/supabase/client.ts`) recebe URL vazia e derruba o app assim que o `AuthProvider`
monta. Corrigido com `eas env:set preview --name ... --value ...` pras 4 variáveis
(`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`EXPO_PUBLIC_API_REAL_RESOURCES` — agora com a lista completa dos recursos que o mobile já
implementa: `users,tracks,lessons,gamification,progress,infinite-mode,materials,uploads-list,
uploads,notifications,bug-reports,users-write` — e `EXPO_PUBLIC_API_BASE_URL`, apontando pro
backend real em produção `https://arqlearn.onrender.com`, confirmado no ar, em vez do
`localhost:8080` que só existe na máquina de dev). Segundo build confirmou as 4 variáveis
carregadas no log e instalou/abriu sem crash — **primeiro teste real em device físico Android,
com sucesso**.

`npx expo-doctor` (roda como parte do build) aponta 1 warning não-bloqueante — dependência
duplicada de `react`/`react-dom` entre `apps/web` (fixa a versão mais nova) e `apps/mobile` (fixa
a versão exata que o SDK 57.0.12 exige) — estrutural de misturar Next.js + Expo no mesmo
workspace, não dá pra alinhar sem piorar um dos dois lados; não trava build (dois builds seguidos
terminaram com sucesso apesar do aviso).

Restou só: testar em iOS (fora de escopo por decisão do usuário) e as validações que só um device
de verdade cobre e ainda não foram exercitadas manualmente (gestos, comportamento em background,
etc. — a lista completa por fase está nos itens #1-#6 acima).

### 8. Auditoria de interatividade pós-APK (13/08/2026) — 2 achados corrigidos
Usuário testou o APK de verdade num Android físico e reportou itens que pareciam clicáveis sem
reagir ao toque. Rodei uma auditoria sistemática (grep + leitura) de todo `apps/mobile/src/app` e
`apps/mobile/src/components/{home,features}` comparando com `apps/web` — achou exatamente 2 casos
reais (o resto do app — Perfil, Liga, Loja, Notificações, Ajuda, quiz completo, Modo Infinito,
Materiais/Chat, mapa de lições — já tinha handler funcional em cada elemento visualmente
interativo, confirmado arquivo por arquivo):

1. **`components/home/DailyGoalCard.tsx`** — botão "Revisar Erros" sem `onPress`. Não é regressão
   mobile: `apps/web/src/components/features/home/DailyGoalCard.tsx` tem o mesmo botão sem
   `onClick` — a funcionalidade de "revisão de erros" nunca foi construída em nenhum dos dois
   apps (sem tela, sem endpoint). Corrigido com um toast informativo
   ("Revisão de erros ainda não está disponível — em breve!", via `useToast()` já usado em outras
   telas) — pelo menos dá feedback real ao toque em vez de silêncio total. A mesma lacuna
   continua existindo no web (fora do escopo desta correção, mas vale reportar lá também).
2. **`components/features/explore/TrackCard.tsx`** (grade "Trilhas Recomendadas" do Explorar) —
   card inteiro sem `onPress`, mesma lacuna espelhando `apps/web/.../TrackCard.tsx` (também sem
   `onClick`, sem rota de "detalhe de trilha" em nenhum dos dois apps). Corrigido reaproveitando o
   `ThemeSelector` já existente: tocar no card agora chama `useTheme().setTopic(track.topic)`
   (mesma função que o seletor de tema usa) + toast de confirmação — dá ao card um efeito real e
   coerente com o resto da tela (o Modo Infinito e o badge "Selecionado" reagem à mudança),
   em vez de inventar uma tela nova.

Verificado ao vivo (mesmo setup `expo start --web` + Playwright + login real): toast do "Revisar
Erros" aparece corretamente; tocar num `TrackCard` troca o tema selecionado de verdade (conferido
no `TopAppBar`, no `InfiniteModePromptCard` e no badge "Selecionado" do próprio card). Nenhum erro
de console.

**Segunda passada, exaustiva (mesmo dia)** — usuário pediu pra testar item por item até tudo ter
interação, não só revisão de código. Cliquei em todo elemento visualmente interativo que ainda não
tinha sido testado ao vivo (só confirmado por leitura de código antes):

- `StreakFreezeCard` "Usar" (Perfil) — corretamente desabilitado (conta de teste tinha 0
  bloqueios de ofensiva disponíveis; comprar um na Loja habilitaria). Não é mockup, é estado
  desabilitado correto.
- `AchievementBadge` bloqueada (Perfil) — toque abre o modal com critério de desbloqueio + botão
  "Entendi", como esperado.
- `ShopFeatureCard`/`ShopCosmeticItem` (Loja) — botões de compra corretamente desabilitados (conta
  de teste com 5 gemas, preços de 200-800) — toque forçado não causa erro nem efeito colateral.
  Mesma observação: desabilitado ≠ mockup, é a regra de negócio funcionando.
- `BugReportForm` (Ajuda) — fluxo completo tipo "bug" (diferente do teste anterior, que só cobriu
  "sugestão"): chip de tipo de dispositivo seleciona visualmente, campo de modelo, envio chega na
  tela de confirmação com o texto certo pro tipo ("ganha 10 gemas" pra bug vs. "50" pra sugestão).
- `NotificationItem` streak_at_risk (Notificações) — toque não navegou desta vez; investigado e
  **não é bug**: o deep-link só existe quando `findCurrentLessonHref()` encontra uma lição
  `in_progress` de verdade, e a conta de teste não tinha nenhuma sessão literalmente em andamento
  no momento do teste (comportamento correto, idêntico ao que `apps/web` faria com os mesmos
  dados — a lógica é um porte direto).
- `SearchBar` (Explorar) — filtra "Trilhas Recomendadas" de verdade (testado buscando
  "Urbanismo", só o card correspondente ficou visível).
- `UploadPromptCard` "Novo Upload" (Explorar) — toque não lança erro (o picker nativo em si só é
  testável num device real, limitação já documentada).
- Barra de abas (Início/Explorar/Liga/Perfil) — navega corretamente entre as 4 rotas.

Nenhum bug novo encontrado nesta passada — os únicos 2 problemas reais do app (itens 1 e 2 acima)
já tinham sido corrigidos e mesclados antes dela começar. Terceiro build EAS (perfil `preview`,
com os 2 fixes) gerado em seguida pro usuário confirmar no device físico.

### 9. Terceira rodada — 7 itens reportados no device físico + varredura adicional (13/08/2026)

Usuário testou o terceiro APK (com os fixes do item #8) e reportou 7 elementos que pareciam
clicáveis sem reagir: ícones de streak/vidas/gemas na `TopAppBar`, uma conquista desbloqueada, o
card "Máximo" (streak_best), o cabeçalho da Liga, uma linha de outro usuário na Liga, os cards de
"Progresso Geral" e o `StreakFreezeCard`. Diferente do item #8 (onde a maioria das lacunas já
existia igual no `apps/web`), aqui a instrução do usuário foi: tornar tudo interativo mesmo que o
web nunca tenha tido essa interação — usando toast informativo mínimo ou reaproveitando telas/
diálogos já existentes no app, nunca inventando feature nova do zero.

1. **`components/home/TopAppBar.tsx`** — ícones de streak e vidas na barra de stats (linha de 3
   pílulas) não abriam nada; no web (`apps/web/.../TopAppBar.tsx`) eles abrem `StreakDialog`/
   `NoHeartsDialog` — gap real de paridade, não intencional. Portado `StreakDialog` do web (não
   existia no mobile) e ligado os dois ícones aos diálogos correspondentes (`NoHeartsDialog` já
   existia, só nunca tinha sido acoplado à barra do topo — só à tela de quiz). O ícone de gemas
   (mudo também no web) ganhou navegação pra `/loja`, já que a Loja é a tela natural pra gastar
   gemas.
2. **`components/features/profile/AchievementBadge.tsx`** — conquistas desbloqueadas eram só
   decorativas (o modal "toque pra revelar" só existia pro estado bloqueado, espelhando o web). A
   API já retorna `unlocked_at` (`Achievement.unlocked_at`) mas nem web nem mobile mostravam isso
   em lugar nenhum. Adicionado modal pro estado desbloqueado também, reaproveitando a mesma
   estrutura visual do modal de bloqueada, com a data formatada (`toLocaleDateString("pt-BR")`).
   Precisou trocar `AchievementGrid`'s `Set<type>` por um `Map<type, unlocked_at>` pra propagar a
   data pro badge.
3. **`components/features/lessonSummary/StatCard.tsx`** — componente compartilhado (usado por
   `ProfileStatsGrid` e `ProgressSummaryCard`, 8 cards no total) ganhou uma prop `onPress?`
   opcional que envolve o conteúdo num `Pressable` só quando fornecida — não muda nada pra quem já
   usa o componente sem a prop (ex.: resumo de lição). Cada um dos 8 cards ganhou um handler
   próprio: `XP Total`/`Máximo`/`Trilhas Concluídas`/`Lições (7 dias)`/`Precisão` mostram um toast
   informativo com o dado formatado (não existe tela dedicada pra nenhum desses); `Sequência`
   reaproveita o `StreakDialog` recém-portado; `Gemas` e `Em Andamento` reaproveitam navegação já
   existente (`/loja` e `/explorar`, respectivamente).
4. **`app/(tabs)/liga.tsx`** — cabeçalho (troféu + nome da liga + regras) virou `Pressable` com
   toast reforçando o nome da liga e a regra de promoção/rebaixamento (mesmo texto que já
   aparecia estático abaixo, só reafirmado ao toque — não existe tela de "detalhe de liga").
5. **`components/features/league/LeagueRankRow.tsx`** — linha de ranking (você ou outro
   competidor) virou `Pressable` com toast mostrando posição + XP da semana (não existe perfil
   público de outro usuário em nenhum dos dois apps).
6. **`components/features/profile/StreakFreezeCard.tsx`** — só o botão "Usar" reagia; o corpo do
   card (ícone + texto) ficava mudo. Corpo agora também é `Pressable`: usa o bloqueio na hora se
   houver algum disponível (mesma função do botão "Usar"), ou navega pra `/loja` se não houver
   nenhum — mesmo padrão de reaproveitamento dos itens acima.

Verificado ao vivo (`expo start --web` + Playwright headless + login real, mesmo setup de sempre;
precisou também corrigir o shim local de teste do `expo-secure-store` — os métodos certos do
módulo nativo são `getValueWithKeyAsync`/`setValueWithKeyAsync`/`deleteValueWithKeyAsync`, não
`getItemAsync`/`setItemAsync`/`deleteItemAsync` como um teste anterior desta sessão presumiu;
shim usado só durante o teste, nunca commitado, revertido ao original no final). Todos os 7 itens
reportados pelo usuário confirmados corrigidos, mais o modal de data de desbloqueio de conquista —
16 interações verificadas ao vivo no total, zero erro de console. `tsc --noEmit` e
`expo export --platform web` também limpos.
