# Pendências — app mobile (`apps/mobile`)

> Registro de trabalho, no mesmo espírito de `PENDENCIAS_IA.md`/`PENDENCIAS_WEB_REAL.md`: o que já
> ficou pronto no app mobile e o que continua faltando pra chegar em paridade com `apps/web`. Plano
> completo (fases, arquivos de referência no web a espelhar) em
> `Docs/stitch_app_visual_identity/` não se aplica aqui — o plano vivo é o que orientou a Fase 0
> (PR #44); as fases seguintes devem seguir a mesma lógica de "espelhar o padrão do web pro RN".
> Apagar cada item conforme for endereçado.
>
> **Checklist de teste manual em device real** (o que já foi testado ao vivo, o que falta, e como
> retomar o ambiente de outro computador) está em `Docs/PENDENCIAS_TESTE_DEVICE.md` — não duplicado
> aqui.

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

**Espelhado no `apps/web` em seguida** (usuário formalizou como regra permanente: toda melhoria
implementada num app precisa ir pro outro também, não só onde a demanda apareceu primeiro) — os
mesmos 6 pontos (gemas na `TopAppBar`, `AchievementBadge` desbloqueada, os 8 `StatCard`, header da
Liga, `LeagueRankRow`, corpo do `StreakFreezeCard`) replicados em React/Next.js. Streak/vidas na
`TopAppBar` do web já abriam diálogo desde antes (é o mobile que tinha ficado pra trás nesses
dois). Detalhes técnicos da versão web em `Docs/PENDENCIAS_WEB_REAL.md` não se aplicam aqui — isso
foi só paridade de UI, não mudança de contrato de API. `next build` e `tsc --noEmit` limpos; 14
interações verificadas ao vivo (`next dev` + Playwright + login real), zero erro de console.

### 10. EAS Update (OTA) configurado — usuário pediu pra parar de reinstalar APK a cada mudança

Até aqui, toda mudança (mesmo só JS/TS) exigia gerar um APK novo no EAS Build e reinstalar no
device manualmente. Configurado `expo-updates` (`npx expo install expo-updates` +
`npx eas-cli@latest update:configure`), que adicionou `updates.url` e `runtimeVersion.policy:
"appVersion"` em `app.json` e o campo `channel` no profile `development` do `eas.json` (`preview`
e `production` já tinham `channel` desde a Fase de build inicial).

**Como funciona daqui pra frente:** só cobre mudanças de JS/TS/assets — o app baixa e aplica
sozinho na próxima abertura, sem passar pelo EAS Build nem pedir reinstalação. Qualquer mudança em
código nativo (novo pacote nativo, permissão em `app.json`, bump de SDK do Expo) continua exigindo
um build novo (`eas build`) e reinstalação do APK — `runtimeVersion.policy: "appVersion"` garante
que um update só é oferecido a instalações com o mesmo `version` do `app.json`, evitando que uma
mudança nativa incompatível seja empurrada por OTA sem querer.

Fluxo pra publicar um update depois de qualquer mudança JS/TS:
```bash
cd apps/mobile
EXPO_TOKEN=... npx eas-cli@latest update --branch preview --message "descrição da mudança"
```
(usar `--branch production` quando esse profile existir de verdade em uso).

**Importante:** o APK que o usuário já tem instalado (build anterior ao PR de configuração do EAS
Update) **não** inclui o runtime nativo do `expo-updates` — não vai receber nenhum update OTA. É
preciso um build novo (`eas build --profile preview`) pelo menos mais uma vez pra "ativar" a
capacidade de update automático; builds seguintes desse profile em diante recebem updates OTA
sem precisar de nova instalação, contanto que a mudança seja só JS/TS/assets.

### 11. Quarta rodada — layout quebrado, modais de detalhe, liga e Configurações completa (15/08/2026)

Usuário pediu 5 correções a partir de um print do Perfil mostrando os `StatCard` com tamanho
inconsistente. Trabalho espelhado em `apps/web` desde o início (regra permanente,
ver item anterior) e em `services/monolith` onde precisou de backend real.

1. **Layout quebrado do `StatCard` (mobile)** — `Pressable` sem `flex: 1` (RN não estica flex por
   padrão como o CSS do web) fazia os cards de uma mesma linha não dividirem o espaço igualmente.
   Corrigido com um `style={{ flex: 1 }}` no `Pressable`.
2. **Toasts → modais** — XP Total, Máximo, Trilhas Concluídas, Lições e Precisão agora abrem
   `StatInfoDialog` (novo, reutilizável) com o dado formatado + explicação, em vez de só um toast;
   Sequência/Máximo reaproveitam o `StreakDialog` já existente. XP Total ganhou barra de progresso
   pro próximo nível.
3. **Liga** — implementado o fechamento semanal de verdade (TDD §6: promove top 5 / rebaixa
   bottom 5 por posição no ranking, grupos com <15 membros não mudam de tier) via
   `user_gamification.current_tier` (migration nova) + `cmd/close-league-week` (operacional, sem
   scheduler nesta fase) + `GET /v1/gamification/league?tier=` (navegar outras ligas, top 50).
   Cabeçalho da Liga abre `LeagueTiersDialog`: quanto falta pra próxima promoção (dado real,
   calculado ao vivo) + abas por liga. Divergência achada e resolvida com o usuário: mockup visual
   original dizia "top 10/bottom 5", TDD diz "top 5/bottom 5" — mantido o TDD.
4. **Nível em vez de XP no header** — `TopAppBar` mostra "Nível N / X XP p/ próx." (fórmula da
   curva de nível portada do backend pra `lib/gamification/level.ts`, já que a API só expõe
   `level` pronto, não o XP faltante).
5. **Configurações completa** — 4 seções novas: "Trilha de estudo" (reaproveita `ThemeSelector`,
   antes só na TopAppBar), "Notificações" (reaproveita `NotificationPreferencesPanel`, antes só na
   tela de Notificações), "Segurança" (trocar senha via `supabase.auth.updateUser`, client-side,
   nunca passa pelo backend) e "Seus dados" (`GET /v1/users/me/export` novo — LGPD, portabilidade:
   perfil+gamificação+conquistas+progresso num JSON; mobile usa `expo-sharing` pra abrir a folha de
   compartilhamento nativa, web dispara um download via Blob). Habilitado `users-write` no
   `.env.local` do mobile (só faltava lá — a build EAS em produção já tinha).

Verificado ao vivo (`expo start --web`/`next dev` + Playwright + login real contra o backend
real): 6/6 (mobile) e 8/8 (web) checks de Configurações — incluindo um download real de
`GET /v1/users/me/export` no teste web, com XP/nível/conquistas reais da conta de teste no JSON
baixado. Liga/StatInfoDialog re-testados junto (16 checks adicionais, ver item anterior). Zero
erro de console em qualquer navegador. `go build`/`vet`/`test`, `tsc --noEmit` (dois apps),
`next build` e `expo export --platform web` todos limpos. Teste de troca de senha ficou restrito à
validação client-side (campos/botão) — não submetido de propósito pra não invalidar a senha real
da conta de teste usada em testes futuros.

### 12. Quinta rodada — bug de barra de nível, Home, bo tão de matéria, liga redesenhada (15/08/2026)

Usuário reportou mais 5 correções, a partir de prints do Perfil e de um mockup detalhado (HTML,
"Stitch") pro novo formato da Liga.

1. **Curva de nível duplicada e divergente** — achado ao investigar "barra sempre cheia":
   `lib/api/mocks/fixtures/levelCurve.ts` (pré-existente, criava um `level` fake calibrado só
   pro fixture) e o `lib/gamification/level.ts` (criado na rodada anterior, curva REAL do
   backend) coexistiam e se contradiziam — `ProfileHeader`, o `LevelProgressCard` do web e os dois
   `AuthContext` ainda usavam a curva errada. Consolidado: `levelCurve.ts` removido dos dois apps,
   tudo migrado pra `level.ts` (ganhou `nivelDoXp`). `mockGamificationProfile.level` corrigido de
   8 pra 3 (o valor real pra xp_total=520).
2. **`LevelProgressCard` não existia no mobile Home** — só no web (DESIGN.md "XP Bar"); portado.
3. **Final da Home mostrava outras matérias** — `MAX_UNITS_SHOWN` (3) empilhava até 2 outras
   trilhas depois da trilha em foco; não fazia mais sentido com a tela de Explorar já madura.
   Trocado pra `MAX_UNITS_SHOWN = 1` + novo `ExploreMoreCard` (CTA pra `/explorar`) no final.
4. **Botão de seleção de matéria (`ThemeSelector`)** — trigger virou um chip com fundo, borda e
   texto em `primary` (antes era texto solto cinza, sem affordance de "isso é clicável").
5. **Liga redesenhada pra hierarquia de 10 ligas x 3 divisões** (Madeira, Pedra, Bronze, Prata,
   Ouro, Platina, Esmeralda, Safira, Rubi, Diamante — cada uma com divisões 3/2/1, 30 posições
   lineares no total, `user_gamification.current_tier` vira um rank 1..30 em vez de 1..5).
   Promoção/rebaixamento passa de top 5/bottom 5 pra top 3/bottom 3 (confirmado com o usuário —
   manteve rebaixamento, que não aparecia no mockup). `CloseLeagueWeek` reescrito pro novo
   intervalo; `minGroupSizeForPromotion` recalculado pro mínimo matemático sem sobreposição (6, em
   vez do buffer de +5 antigo — divisões são naturalmente menores agora, por design).
   `GET /v1/gamification/league` ganha `?division=` (junto de `?tier=`) e `division` na resposta.
   Migration nova alarga o `CHECK` de `current_tier` de 1-5 pra 1-30. Frontend: `LeagueHeader`
   (cabeçalho com ícone circular por liga, descrição dinâmica "os N melhores avançam pra Liga X
   Y", countdown), `LeagueProgressionTrack` (nova, trilha horizontal com as 10 ligas, a atual em
   destaque, cada uma tocável) e `LeagueTiersDialog` reescrito pra navegar liga (10 ícones) +
   divisão (3 abas) em vez do antigo seletor de 5 abas direto. `LeagueRankRow` ganha destaque
   visual (cor terciária) pra quem está na zona de promoção, espelhando o mockup.

Bug encontrado e corrigido durante o teste ao vivo (web): `max-w-md` no novo `LeagueHeader.tsx`
colapsava o parágrafo de descrição pra 16px de largura (uma palavra por linha) — `globals.css`
define `--spacing-md: 16px` mas nunca definiu um `--max-width-md` próprio, e o Tailwind v4 cai
pro token de spacing na ausência de um mais específico. Nenhum outro lugar do app usa `max-w-md`
hoje (não é uma quebra generalizada, só ninguém tinha pisado nessa combinação ainda); corrigido
com `max-w-[28rem]` só neste componente, comentário deixado no código pra quem for usar
`max-w-{sm,md,lg,xl}` no futuro.

Verificado ao vivo (mesmo setup de sempre): 9/9 (mobile) e 8/8 (web) checks, incluindo a barra de
nível confirmada NÃO mais sempre cheia (170/500 XP ≈ 34% de preenchimento real, medido via
`getBoundingClientRect`), o modal de todas as ligas abrindo com os 10 ícones + 3 divisões, e a
zona de promoção real da conta de teste. Zero erro de console. `go build`/`vet`/`test`,
`tsc --noEmit` (dois apps), `next build` e `expo export --platform web` todos limpos. Migration
0008 aplicada no banco real; `cmd/close-league-week` rodado de novo manualmente, confirmou a nova
trava de tamanho mínimo (6) corretamente.

### 13. Sexta rodada — TopAppBar, desbloqueio de lição por conteúdo, expiração de streak (15/08/2026)

Usuário reportou 4 correções a partir de um print da Home mobile:

1. **`Nível`/`XP` do `TopAppBar` em duas linhas** — juntados numa linha só (`<Text>` aninhado no
   mobile, `flex items-baseline` no web).
2. **Fog escondendo lições distantes como "bloqueáveis"** — removido dos dois apps. `FogOverlay.tsx`
   (web) deletado.
3. **Lição sem pergunta aprovada devia ficar "em construção"; com pergunta, liberada fora de
   ordem** — `GET /v1/tracks/{track_id}/lessons` ganha `has_questions` (calculado em lote via
   `fetchLessonsWithApprovedQuestions`, mesmo filtro `review_status: "approved"` de
   `POST .../session`). `LessonNodeVariant`/`UnitStatus` trocam `locked` por `available`/
   `construction` nos dois apps; `unitStatusFor`/`variantFor` reescritos.
4. **Streak não expirava e não havia oferta proativa de Bloqueio de Ofensiva** — expiração
   preguiçosa (`AplicarExpiracaoStreak`/`StreakEmRisco`, TDD §5.2/§5.3), mesmo padrão sem cron da
   regeneração de vidas (§5.4): `GET /v1/gamification/me`, `GET /v1/users/me` e
   `POST .../answers` agora aplicam a expiração antes de ler/gravar streak. `GamificationProfile`
   ganha `streak_freezes_available`/`streak_at_risk`; novo `StreakAtRiskPrompt` (mobile+web,
   montado no layout raiz) abre o `StreakDialog` sozinho quando `streak_at_risk` é true.

**3 bugs reais encontrados e corrigidos durante o teste ao vivo** (só apareceram com backend real
+ Postgres real — nenhum surgiu em `tsc`/`go test`/mock):
- `AplicarExpiracaoStreak` original não avançava `streak_last_active_date` no consumo automático
  (fiel à leitura literal do TDD, que descreve um job que roda 1x/dia) — mas chamado de forma
  preguiçosa (sem job), a mesma streak "atrasada" era reavaliada em **toda** requisição do dia
  (cada `GET /v1/gamification/me`, cada pergunta respondida), consumindo um freeze por request em
  vez de um por dia. Reproduzido ao vivo: 5 requisições em ~2s zeraram uma streak de 5 dias com 2
  freezes disponíveis. Corrigido fazendo a função avançar a data pra "ontem" (nunca "hoje" — a
  pessoa ainda precisa praticar hoje) ao consumir um freeze, tornando a avaliação idempotente
  dentro do mesmo dia sem violar a regra do TDD.
- `GET /v1/users/me` (`handleGetMe`, `internal/users/users.go`) nunca populava
  `streak_freezes_available`/`streak_at_risk` na resposta apesar de já chamar
  `LoadStreakWithExpiration` — os dois campos simplesmente não existiam no struct de resposta.
  Sem isso, o `StreakAtRiskPrompt` nunca tinha `streak_at_risk` de verdade pra reagir (ficava
  sempre `false`, undefined→falsy no client).
- `StreakAtRiskPrompt` e `AllDonePrompt` (web e mobile) são dois modais globais independentes que
  podem ficar `open` ao mesmo tempo (ex.: trilha 100% concluída E streak em risco) — o que montou
  por último ficava por cima e interceptava clique do outro (`AllDonePrompt` tampando o botão
  "Usar Bloqueio Agora"). `AllDonePrompt` ganhou `suppressAutoOpen` (não abre sozinho quando
  `gamification.streak_at_risk` é true — streak é mais urgente, morre à meia-noite; Modo Infinito
  não tem prazo).

Verificado ao vivo (mesmo setup de sempre, login real com a conta de teste): item 1 confirmado nas
duas plataformas (linha única do Nível/XP). Itens 2+3 confirmados navegando a trilha real
"Maquetes" (16 lições, todas com pergunta aprovada) — nós fora de ordem renderizando como
`available` (navegáveis, sem fog) em vez do antigo bloqueio sequencial; um nó fora de ordem clicado
abriu uma sessão de pergunta real. (Nenhuma lição sem pergunta aprovada existe hoje nos dados
semeados — variant `construction` confirmado só por leitura de código/teste unitário, não visto ao
vivo por falta de dado de teste nesse estado.) Item 4 confirmado ponta a ponta manipulando
temporariamente `user_gamification` da conta de teste via um script Go descartável (nunca
commitado): streak em risco abriu o diálogo sozinho ao carregar o app, "Usar Bloqueio Agora"
consumiu o freeze e persistiu no Postgres, card do Perfil refletiu o novo estado — dado de teste
restaurado ao original ao final. Zero erro de console (fora um aviso de hydration mismatch
`aria-hidden` do Radix Dialog, esperado/benigno, não relacionado a esta mudança).
`go build`/`vet`/`test`/`gofmt -l`, `tsc --noEmit` (dois apps), `next build` e
`expo export --platform web` todos limpos.

### 14. Auditoria das "trilhas em destaque" sem conteúdo real (15/08/2026)

Usuário pediu pra conferir, uma por uma, se as trilhas "em destaque" sem itens estavam marcadas
como "em construção". Consulta direta no Mongo (44 trilhas reais da grade curricular) revelou que
os **7 temas "de vitrine" originais** (`fundamentos`, `historia`, `urbanismo`,
`sistemas_construtivos`, `arquitetura_moderna`, `conforto_termico`, `estruturas` — os que aparecem
em destaque no `ThemeSelector` e nos cards "Trilhas Recomendadas" do Explorar) estavam **todos**
marcados `hasContent: true` em `themes.ts`, mas **nenhum** corresponde a uma trilha real hoje: 6
não têm nem trilha com esse `topic` no banco, e o 7º (`conforto_termico`) até bate com uma trilha
real (`track_s02_conforto_termico`), mas ela tem 0 lições. Resultado: o app prometia um mapa
pronto que, na prática, ou caía silenciosamente numa trilha real não relacionada (fallback de
`featuredTrack` em `page.tsx`/`index.tsx`, sem nenhum aviso) ou mostrava "CONCLUÍDO" numa trilha
vazia.

**Achado ao vivo, corrigido junto:** `unitStatusFor([])` — `Array.prototype.every` em array vazio
é vacuosamente `true`, então uma trilha sem NENHUMA lição (`units: []` no Mongo, ex.: a trilha real
"Arquitetura Brasileira") caía no primeiro `if` e virava "CONCLUÍDO" em vez de "EM CONSTRUÇÃO" —
reproduzido ao vivo antes da correção, confirmado corrigido depois.

Mudanças (mobile + web):
- `themes.ts`: os 7 temas de vitrine passam a `hasContent: false`.
- `unitStatusFor`: trilha com `lessons.length === 0` retorna `"construction"` direto, sem passar
  pelo `every` vacuoso.
- `exploreTracks.ts`: `RecommendedTrack` ganha `hasContent` (derivado de `themes.ts` pelo mesmo
  `topic`, uma única fonte de verdade) — os cards de "Trilhas Recomendadas" sem conteúdo real
  trocam o selo de dificuldade/duração (que seriam inventados) por "Em construção" e esmaecem.
- `InfiniteModePromptCard`: ganha prop `hasContent` — sem isso, "Desafiar-se" num tema vazio caía
  no `404 TOPIC_HAS_NO_QUESTIONS` do backend (`POST /v1/infinite-mode/sessions` só sorteia entre
  perguntas aprovadas do tópico). Agora mostra "Em construção" no lugar do botão.
- `ThemeSelector` (web): a seção "Trilhas em destaque" nunca tinha o tratamento de
  cadeado/"Em construção" que a lista de disciplinas por semestre já tinha (`disabled`,
  ícone de cadeado, rótulo em vermelho) — só ninguém tinha notado porque os 7 vitrine estavam
  (erroneamente) sempre `hasContent: true`. Unificado: mesmo tratamento nas duas seções. No
  mobile já não tinha essa lacuna — as duas seções sempre compartilharam o mesmo `ThemeRow`.
- Web ganhou paridade que faltava: `TrackCard` (Explorar) não tinha `onClick` nenhum (mobile já
  selecionava o tema ao tocar, via `setTopic`); agora os dois selecionam o tema ao clicar/tocar.

As 5 trilhas reais com conteúdo aprovado (`construcoes_sustentaveis`, `desenho_arquitetura_urbanismo`,
`maquetes`, `projeto_arquitetura_cultural`, `informatica_projecoes_ortogonais`) já estavam
corretamente marcadas `hasContent: true` — confirmado, não precisaram de correção.

Verificado ao vivo (mesmo setup de sempre, login real): Home mostra o aviso "Ainda estamos
preparando as lições de Fundamentos de Arquitetura" (nunca aparecia antes) e a trilha de
fallback "Arquitetura Brasileira" corretamente "EM CONSTRUÇÃO" em vez de "CONCLUÍDO"; Explorar
mostra as 7 "Trilhas Recomendadas" com selo "Em construção" e o card de Modo Infinito com
"Em construção" no lugar de "Desafiar-se"; dropdown do `ThemeSelector` mostra cadeado + "Em
construção" nas 7 trilhas em destaque, mantendo as 5 reais desbloqueadas. Idêntico nos dois apps,
zero erro de console. `tsc --noEmit` (dois apps) e `next build` limpos (sem mudança de backend
nesta rodada, então sem novo `go build`/`test`).

### 15. Indicador de carregamento unificado — "Blueprint" (15/08/2026)

Usuário adicionou um novo design ao Stitch (`tela_de_carregamento_splash_screen/`, fora das 17
telas originais): um prédio se desenhando à mão (traço com `stroke-dashoffset`, lapiseira
percorrendo o contorno, anel de pulso, grade + cantos técnicos de prancheta) e pediu pra aplicar
como carregamento padrão em "todas as ações do app".

Levantamento prévio (agente `Explore`) catalogou ~41 pontos de carregamento espalhados nos dois
apps — `ActivityIndicator` (mobile), `animate-spin` (web), textos "Salvando…"/"Carregando…" sem
nenhum ícone, os 2 gates de resolução de sessão (`AuthContext.tsx` web / `_layout.tsx` mobile) e 5
telas cheias de "Carregando…" em texto puro sem spinner nenhum. **Decisão de escopo:** os 5
`loading.tsx` do App Router do web (skeleton, não spinner) ficaram de fora de propósito — é um
padrão de UX diferente e deliberado (evita layout shift combinando com o formato da tela de
destino, documentado em `Skeleton.tsx`), não uma "ação" no sentido que o usuário pediu.

Criado `components/ui/LoadingBlueprint.tsx` nos dois apps (`variant="fullscreen"` — grade + cantos
+ ícone + wordmark "ArqLearn" + legenda; `variant="inline"` — só o ícone, pro spinner de botão) e
aplicado em: os 2 gates de auth, as 5 telas de "Carregando…" (sessão de lição/Modo
Infinito/resumo de material), e os 10 spinners de botão (`animate-spin`/`ActivityIndicator`,
inclusive dois achados sem nenhum indicador visual antes — "Explique melhor"/"Aprofundando..." e
o `ShopFeatureCard` do web, que tinha o `pending` na prop mas nunca usava).

**Web**: `@keyframes blueprint-draw`/`blueprint-pencil`/`pulse-soft` novos em `globals.css`, mesma
convenção das keyframes de Modal/Dropdown já existentes ali.

**Mobile**: CSS keyframes não existem em React Native — a mesma linha do tempo de 3s é reproduzida
com `Animated.Value` + interpolações. Isso exigiu adicionar `react-native-svg` (dependência nativa
nova, aprovada explicitamente pelo usuário depois de eu explicar o trade-off: fidelidade total ao
Stitch exige SVG animado, e isso significa **um build novo do APK** — instalações atuais não vão
receber esse recurso só por OTA; toda mudança JS/TS futura continua indo por OTA normalmente).

**Bug encontrado e corrigido durante o teste ao vivo**: a primeira versão da lapiseira usava
`translateX`/`translateY` diretamente num `<G>` animado do react-native-svg — props depreciadas
(a favor de `transform`) que no alvo web (`react-native-svg-web`, usado só pro teste local deste
ambiente) vazavam como atributos DOM inválidos (`translatex`/`translatey`), gerando warning de
console a cada render. Corrigido trocando o `<G>` animado por um `Animated.View` simples
(círculo) posicionado por cima do `Svg` com `left`/`top` interpolados — mesmo trajeto, sem a
linha decorativa da ponta (simplificação deliberada, puramente cosmética). Não afeta iOS/Android
reais (não existe DOM lá); só aparecia no `expo start --web` usado para testar neste ambiente.

Verificado ao vivo (mesmo setup de sempre): tela cheia de "Carregando lição…" confirmada nos dois
apps com a animação completa (grade, cantos, prédio se desenhando frame a frame, pulso, wordmark),
throttling as respostas do backend pra segurar o estado tempo suficiente pra capturar. Zero erro
de console relacionado à mudança (só o warning `collapsable` remanescente, conhecido do
react-native-svg no alvo web, não afeta nativo). `tsc --noEmit` (dois apps), `next build` e
`expo export --platform web` todos limpos. Nenhuma mudança de backend nesta rodada.

### 16. Baú Diário — novo sistema de recompensa 1x/dia (15/08/2026)

Usuário pediu um sistema novo: 1 vez por dia, ao completar 10 perguntas (lição + Modo Infinito
somados), o usuário libera um Baú Diário que pode conter gemas (1–5) ou um item do sistema —
anexou 4 mockups Stitch (baú fechado "Abrir Baú", duas variantes de baú aberto "Recompensas
Coletadas!", e uma variante mostrando que o prêmio também pode ser um item — "Bloqueio de
Ofensiva"). Via `AskUserQuestion`, usuário confirmou: pool de recompensa é "Gemas + itens do
sistema" (não itens *custando* 1–5 gemas — os preços reais da Loja são 200–1200) e o contador
soma perguntas **acumuladas no dia** (lição + Modo Infinito juntos), não só uma sessão.

**Backend** (migration `0009_daily_chest`, aplicada no banco real):
- `user_gamification` ganha `chest_questions_today`, `chest_questions_date`, `chest_claimed_date`
  — mesmo padrão de reset preguiçoso (sem cron) já usado por `xp_today`/streak/vidas:
  `QuestoesHojeAposReset` zera o contador quando `chest_questions_date` não é hoje no fuso do
  usuário, do jeito que já existia pra XP.
- `RolarRecompensaBau(rollType, rollDetail)` (função pura, testada): 75% gemas (1–5, uniforme),
  25% item grátis — dividido 50/50 entre `streak_freeze` e `hearts_refill` (os dois itens não-
  cosméticos reais da Loja, `migrations/0004_shop_items_seed`; cosméticos ficam de fora do pool
  por serem caros demais pra dar de graça todo dia).
- `handleSubmitAnswer` (lição) e `handleInfiniteModeAnswer` (Modo Infinito) agora incrementam
  `chest_questions_today` a cada resposta e devolvem `daily_chest_available`/
  `daily_chest_questions` no payload — cliente nunca decide sozinho se o baú está disponível.
- `GET /v1/gamification/daily-chest` (status) e `POST /v1/gamification/daily-chest/open`
  (abertura — revalida disponibilidade no servidor, sorteia a recompensa, credita
  transacionalmente e grava `chest_claimed_date`, `409 CHEST_NOT_AVAILABLE` se já foi aberto ou
  ainda não bateu 10 perguntas hoje). Documentado em `ArqLearn_API_Specification.md` §8.1 (v1.18).

**Frontend** (mobile + web, paridade completa): tipos/recursos de API/mocks novos
(`dailyChest.ts` em cada app — contador mock compartilhado entre `quizSessions.ts` e
`infiniteModeSessions.ts` via `bumpMockChestQuestions()`, já que o contador real também soma os
dois). Tela nova `/bau` (web: `app/(lesson)/bau/page.tsx`; mobile: `app/bau.tsx`, registrada em
`_layout.tsx`) com o mesmo padrão visual da tela de conquista — mas creditando via chamada de API
real (`openDailyChest()`), não crédito local, já que a recompensa é sorteada no servidor e não dá
pra simular. Estado "baú indisponível" tratado (usuário navega direto pra `/bau` sem ter batido
10 perguntas, ou atualiza a página depois de já ter aberto). CTA "Abrir Baú Diário" (botão
`variant="gamification"`) aparece nos resumos de lição e de Modo Infinito quando
`daily_chest_available` vem `true` na última resposta da sessão — parâmetro `chest` propagado
pela URL/params de navegação (mesmo padrão de `xp`/`accuracy`/`streak`/`hearts` já existente).

**Verificação:** `go build`/`vet`/`test`/`gofmt -l` limpos; `tsc --noEmit` (dois apps), `next
build` e `expo export --platform web` todos limpos, incluindo a rota nova `/bau` aparecendo no
build do Next. Teste de UI ponta a ponta com login real (Playwright) **não foi possível nesta
rodada** — as credenciais da conta de teste não estavam disponíveis nesta sessão, e mintar uma
sessão de login via API admin do Supabase (`generate_link`) foi bloqueado pelo classificador de
permissão do Claude Code por ser uma ação sensível (impersonar login), decisão respeitada sem
tentar contornar. Em vez disso, a lógica de backend foi validada **ao vivo contra o Postgres
real** com um script Go descartável (nunca commitado, mesmo padrão já usado antes nesta pendência)
chamando `gamification.LoadDailyChestStatus` de verdade e reproduzindo o UPDATE exato do handler
de abertura, na conta de teste `maria.aluna@arqlearn.test`: confirmado que 4 perguntas → baú
indisponível, 10 perguntas → disponível, contador de dia anterior reseta pra 0 via
`QuestoesHojeAposReset`, abertura credita as gemas corretamente e persiste `chest_claimed_date`, e
reabrir no mesmo dia fica bloqueado (`claimed_today=true`) — os 5 cenários bateram exatamente com
o esperado. Estado da conta de teste restaurado ao original ao final. **Pendência real:** ainda
falta um teste de UI ao vivo (clique em "Abrir Baú", transição fechado→aberto, CTA nos resumos)
assim que uma sessão de login real estiver disponível numa sessão futura.

### 17. Baú Semanal + cards de progresso na Home (15/08/2026)

Usuário colou um novo mockup Stitch da Home mostrando dois cards lado a lado ("Baú Diário"
12/20 questões, "Baú Semanal" 85/150 questões, cada um com barra de progresso) e explicou a regra
real (os números do mockup são só placeholder): Baú Semanal libera ao responder **50 perguntas em
menos de uma semana**; se passar uma semana sem conseguir, reseta; o Baú Diário (item #16) já
resetava sozinho a cada dia sem prática, confirmado que está certo. Via `AskUserQuestion`, duas
decisões de design fechadas: (1) abrir o baú semanal **antes** do ciclo de 7 dias terminar **não**
adianta o reset — o próximo ciclo só começa quando os 7 dias originais realmente passarem, mesmo
já tendo aberto; (2) recompensa do semanal é **maior** que a do diário, reflete o esforço extra de
50 perguntas contra 10.

**Backend** (migration `0010_weekly_chest`, aplicada no banco real):
- `user_gamification` ganha `chest_weekly_questions`, `chest_weekly_cycle_start`,
  `chest_weekly_claimed_cycle_start`. Diferente do diário (reset por igualdade de data), o ciclo
  semanal é uma **janela rolante de 7 dias**: `QuestoesSemanaAposReset` só reseta quando 7 dias já
  passaram desde `chest_weekly_cycle_start` — abrir cedo não adianta nada, por decisão do usuário.
  A trava de "1 por ciclo" compara `chest_weekly_claimed_cycle_start` com o `cycle_start` vigente
  em vez de usar um boolean solto — isso sozinho já "desclaima" o baú quando o ciclo vira, sem
  precisar zerar essa coluna em lugar nenhum.
- `RolarRecompensaBauSemanal(rollType, rollDetail)` (função pura, testada): recompensa maior que a
  do diário — 60% gemas (5–15, contra 1–5 do diário) e 40% item grátis (contra 25%, mesmos dois
  itens do Baú Diário).
- `handleSubmitAnswer`/`handleInfiniteModeAnswer` também incrementam `chest_weekly_questions` a
  cada resposta (mesma pergunta soma pros dois contadores, diário e semanal, independentemente) —
  mas, ao contrário do diário, essas respostas **não** ganham campo de status do baú semanal no
  payload (o card de progresso da Home não precisa de feedback instantâneo por resposta como o CTA
  do resumo precisa; consulta `GET /v1/gamification/weekly-chest` à parte).
- `GET /v1/gamification/weekly-chest` (status) e `POST /v1/gamification/weekly-chest/open`
  (abertura). Documentado em `ArqLearn_API_Specification.md` §8.2 (v1.19).

**Frontend** (mobile + web, paridade completa):
- `weeklyChest.ts` novo em cada app (mesmo padrão de `dailyChest.ts`) — contador mock também
  incrementado em `bumpMockWeeklyChestQuestions()`, chamado nos mesmos pontos de
  `bumpMockChestQuestions()` em `quizSessions.ts`/`infiniteModeSessions.ts`.
- Tela `/bau` (web e mobile) **parametrizada** com `?tipo=diario|semanal` (default diário) — mesmo
  shell visual fechado→aberto do item #16, mas escolhendo o endpoint/textos certos por tipo em vez
  de duplicar a tela inteira.
- Cards `ChestProgressCard` novos (web: `components/features/home/`; mobile:
  `components/home/`) — sempre visíveis na Home (não só quando disponível), com barra de progresso
  e link/toque pra `/bau?tipo=...`; clicar mesmo indisponível não é beco sem saída, a tela `/bau`
  já trata esse estado. Home (web, Server Component) busca os dois status via `Promise.all` junto
  com `getMe`/`listTracks`; Home (mobile) busca em um `useEffect` separado por não bloquear o
  carregamento do mapa de trilhas.

**Verificação:** `go build`/`vet`/`test`/`gofmt -l` limpos; `tsc --noEmit` (dois apps), `next
build` (rota `/bau` continua aparecendo, agora parametrizada) e `expo export --platform web`
todos limpos. Mesma limitação do item #16 pro teste de UI ao vivo — sem credenciais de teste
disponíveis nesta sessão, e mintar sessão de login via API admin do Supabase segue bloqueado pelo
classificador de permissão do Claude Code. Lógica de backend validada **ao vivo contra o Postgres
real** (script Go descartável, nunca commitado) na conta de teste: 7 cenários confirmados —
30 perguntas → indisponível, 50 → disponível, ciclo com 6 dias → mantém contador e ainda
disponível, ciclo com 8 dias (expirado) → reseta pra 0 e inicia novo ciclo hoje, abertura credita
as gemas certas e persiste `chest_weekly_claimed_cycle_start`, reabrir no mesmo ciclo (mesmo
respondendo mais perguntas) fica bloqueado, e — o cenário mais importante — abrir cedo (dia 3) e
depois consultar de novo confirma que o ciclo **não** reseta antes do dia 8, exatamente a decisão
que o usuário pediu. Estado da conta de teste restaurado ao original ao final. **Pendência real:**
mesma do item #16 — falta o teste de UI ao vivo (clique nos cards da Home, abertura dos dois
baús) assim que uma sessão de login real estiver disponível numa sessão futura.

### 18. Teste de UI ao vivo do Baú Diário + Semanal — pendência dos itens #16/#17 fechada (15/08/2026)

Usuário forneceu a senha da conta de teste `maria.aluna@arqlearn.test` a pedido explícito
(perguntado via `AskUserQuestion` depois de listar as pendências abertas do projeto), destravando
o teste de UI ao vivo que ficou em aberto nos itens #16 e #17.

**Setup:** `services/monolith` (backend real) + `next dev` (web) + `expo start --web` (mobile) +
script Go descartável (nunca commitado) pra preparar a conta de teste com os dois baús
disponíveis, rodando `chromium` via Playwright direto (sem MCP de browser disponível nesta
sessão) — login real preenchendo o formulário, sem atalho.

**Dois problemas de ambiente de teste encontrados e contornados — nenhum é bug do app:**
- **Mobile (`expo start --web`)**: `ExpoSecureStore.web.js` (stub vazio do pacote, já documentado
  na memória "project_expo_secure_store_web_shim") quebrava o login com
  `setValueWithKeyAsync is not a function`. Aplicado o shim local já documentado (nomes
  `*WithKeyAsync`, nunca commitado), restaurado ao original ao final.
- **Mobile (`expo start --web`) contra o backend local**: `CORS_ALLOWED_ORIGINS` só liberava
  `localhost:3000` (origem do web) — o dev server do Expo web roda em `localhost:8081`, outra
  origem, bloqueada pelo preflight do navegador. Adicionado temporariamente ao `.env` local
  (nunca commitado), restaurado ao original ao final. Acidente à parte que vale registrar: matar
  o processo do backend por porta (`lsof -ti:8080 | xargs kill`) falhou silenciosamente neste
  ambiente (lsof não enxerga o processo de verdade no Windows/Git Bash) — o `go run` novo
  simplesmente falhava o bind e o processo antigo (com o CORS desatualizado) continuava
  respondendo, mascarado porque o health check batia nele igual. `taskkill //F //PID <pid>` (pid
  via `netstat -ano`) é o jeito confiável de matar processo por porta neste ambiente, não
  `lsof`/`kill`.

**Resultado — os dois apps, ponta a ponta, contra o backend e Postgres reais:**
- Login real com email/senha funcionou nos dois.
- Home mostrou os dois cards (`Baú Diário`/`Baú Semanal`) com "Disponível!" e barra cheia.
- Tocar em cada card abriu `/bau?tipo=diario` / `/bau?tipo=semanal` corretamente, tela fechada com
  o texto certo por tipo ("Você ganhou um Baú de Projeto!" / "Você ganhou um Baú Semanal!").
  "Abrir Baú" chamou a API de verdade e sorteou recompensas reais em cada tentativa (gemas
  variando 1–5 no diário e o card semanal chegando a **+10 gemas**, confirmando ao vivo a faixa
  maior 5–15 do semanal vs. 1–5 do diário; também saiu "Vidas Restauradas" real no web, cobrindo
  o caminho de item também, não só gemas).
  Voltando pra Home, os dois cards passaram a mostrar "Já resgatado", confirmando a trava de "1
  por período" refletida na UI de verdade, não só no banco.
- Zero erro de console novo em qualquer navegador — só o warning `collapsable` já conhecido do
  react-native-svg no alvo web (não relacionado a esta feature, não afeta nativo).

Conta de teste restaurada ao estado neutro ao final (baú diário/semanal zerados, gems=5).
**Itens #16 e #17 estão fechados** — não há mais pendência de teste de UI pra Baú Diário/Semanal.

### 19. VIP "Mestre Arquiteto" (15/08/2026)

A pedido do usuário: tier VIP com +25% de XP, Baú Semanal garantido (sempre Bloqueio de Ofensiva,
sem sorteio), 1 reset extra do Baú Diário/dia e 2 do Baú Semanal/ciclo, e perfil com coroa/selo
dourado — a partir de 3 mockups Stitch anexados (Assinatura VIP, Recompensa VIP - Baú de Ouro,
Perfil VIP). Backend: migration 0011 (`is_vip`/`vip_expires_at`/contadores de reset em
`user_gamification`, tabela `vip_coupons`), `internal/gamification/vip.go` novo (6 endpoints —
`GET /v1/vip/status`, `POST /v1/vip/coupons[/redeem]`, `POST /v1/vip/subscribe`, `POST
/v1/gamification/{daily,weekly}-chest/reset`), `EhVIPAtivo`/`EstenderVIP`/`VIPResetsAposReset`
testados em `algorithms_test.go`. Ativação por dois caminhos (decisão do usuário): cupom de 10
dígitos gerado por admin (funcional) e assinatura recorrente (schema pronto, endpoint desabilitado
— `VIPSubscriptionsEnabled = false`, sem gateway de pagamento integrado ainda).

Frontend (paridade mobile+web): nova tela `/vip` (paywall/resgate de cupom, adaptada do mockup),
`ProfileHeader` com coroa/nome dourado/selo "Mestre Arquiteto" quando `is_vip`, botão "Resetar Baú
(VIP)" na tela `/bau` quando o baú do período já foi reivindicado.

Verificado: `go build/vet/test` limpos (`algorithms_test.go` cobre os novos helpers puros),
`tsc --noEmit` limpo nos dois apps, `npm install` na raiz rodado antes (branch estava com
dependências desatualizadas em relação à `main`, corrigido). **Teste de UI ao vivo não foi possível
nesta rodada** — sem credenciais de conta de teste disponíveis nesta sessão (mesma limitação já
registrada nos itens #16/#17 antes da senha ser fornecida); fica pendente pra próxima sessão com
acesso à conta de teste, junto de: (1) confirmar ao vivo que o Baú Semanal de uma conta VIP sai
sempre com Bloqueio de Ofensiva; (2) confirmar que o reset de baú realmente reabre a tela sem exigir
novas perguntas; (3) testar o fluxo de resgate de cupom ponta a ponta contra o Postgres real
(gerar cupom via `POST /v1/vip/coupons` com uma conta admin, resgatar com a conta de teste).

### 20. `predictiveBackGestureEnabled` reativado — precisa validar em device/emulador (17/08/2026)

`/impeccable audit` (Home) encontrou `apps/mobile/app.json`'s `android.predictiveBackGestureEnabled:
false` sem nenhuma justificativa documentada em lugar nenhum do repositório — `git log` confirma que
é o default do próprio scaffold do Expo (`0b7ef1b`, commit inicial de config), nunca uma decisão
deliberada do produto. Reativado para `true` (o default do Android) a pedido do usuário.

**Validado parcialmente em device real** (17/08/2026, build de dev client via EAS após o Expo Go da
loja ficar incompatível com o SDK 57 — ver item de `expo-dev-client` no histórico): o botão "voltar"
físico/na tela (modo de navegação por 3 botões, não por gestos) navega corretamente entre lição e
Home, sem travar ou piscar. **Ainda não testado**: o teste real do gesto preditivo em si (arrastar da
borda) — o aparelho de teste usa o modo de 3 botões, onde esse gesto nem existe no Android (é
exclusivo do modo de navegação por gestos). Falta testar num aparelho em modo de gestos, ou trocar
temporariamente o mesmo aparelho pra esse modo, pra confirmar que nenhuma transição de tela quebra
sob o preview ao vivo. Se algo quebrar, a correção é ajustar a transição afetada, não voltar a
desligar a gesture globalmente.

### 21. Home sem pull-to-refresh — achado durante teste manual em device (17/08/2026)

Testando ao vivo o comportamento de `useReduceMotion`/`LoadingBlueprint` com "Remover animações"
ligado nas configurações de acessibilidade do Android, percebemos que a Home (`(tabs)/index.tsx`)
não tem `RefreshControl` nenhum no `ScrollView` — não existe gesto de puxar-pra-atualizar,
confirmado no código (`grep RefreshControl` não acha nada no arquivo). Forçar reload hoje só dá
puxando fechar e reabrir o app, ou trocando o tema no seletor (que já retrigger a busca de
tracks/lessons via `useEffect`).

**Pendências**:
1. Adicionar `RefreshControl` na Home (padrão esperado em apps desse tipo).
2. Depois de existir, re-verificar ao vivo se `LoadingBlueprint` de fato respeita "Remover
   animações" nesse fluxo — o teste desta sessão não fechou com confirmação clara (usuário não
   conseguiu isolar se a preferência do sistema estava realmente sendo lida a tempo do reload).

### 22. Fases 1–3 do "O que fazer a seguir" de `PENDENCIAS_TESTE_DEVICE.md` fechadas (17/08/2026)

Usuário pediu pra rodar, em sequência, as 3 primeiras fases de um plano derivado do menu do
`/impeccable` (decisões de design pendentes → qualidade técnica → pull-to-refresh), resolvendo
sozinho toda decisão em aberto com base no sistema já implementado, sem parar pra perguntar a cada
uma. Escopo desta demanda: só `apps/mobile` (usuário confirmou explicitamente "só o app por
enquanto") — a paridade com `apps/web` (regra permanente, ver item #9) **ainda não foi replicada**
e fica registrada como dívida pra uma próxima demanda.

**1. `/impeccable shape` — formato do `Toggle`:** decidido manter o switch próprio da marca (já
idêntico nas duas plataformas, tokens compartilhados, dois consumidores reais em produção) em vez
de trocar por `Switch` nativo por plataforma — nada quebrado, nenhum problema real que a troca
resolveria. Documentado em `apps/mobile/DESIGN.md` (Components → Toggle).

**2. `/impeccable document` — lock de orientação:** decidido manter `"orientation": "portrait"`
em `app.json` — nenhuma tela do app tem composição landscape desenhada (quiz, Learning Map, os
bands do `TopAppBar`), e o iPad já tem seu próprio tratamento (coluna centralizada `maxWidth: 448`)
sem precisar de paisagem. Documentado em `apps/mobile/DESIGN.md` (Layout).

**3. `/impeccable audit` focado em `--color-outline-variant`:** contraste medido em ~1.6:1 contra
`surfaceBright`/`surfaceGray` (mínimo WCAG 1.4.11 é 3:1) — abaixo do mínimo, confirmando a suspeita
registrada no item #6 de `PENDENCIAS_TESTE_DEVICE.md`. Resolvido replicando o valor exato já
publicado no `apps/web` (`#c2c7d0` → `#7f8894`) em vez de derivar um tom novo, já que os tokens de
superfície (`surfaceBright`/`surfaceGray`) são idênticos nas duas plataformas — o mesmo valor mede
3.4:1/3.3:1 aqui também. `apps/mobile/src/theme/tokens.ts` e `DESIGN.md` atualizados.

**4. `/impeccable layout` no `TopAppBar`:** as duas faixas utilitárias (seletor de tema, pílulas de
streak/vidas/gemas) — antes duas `View`s empilhadas, cada uma com seu próprio fundo/borda — viraram
uma faixa única (uma borda, um fundo, `gap: spacing.xs` entre as duas linhas). Mesmos 6 alvos de
toque, mesmo tamanho, uma borda repetida a menos.

**5. `/impeccable optimize` no `ThemeSelector`:** `ScrollView` com `.map()` manual trocado por
`SectionList` (seções = "Trilhas em destaque" + um grupo por semestre com tema) — o catálogo já
passa de ~50 entradas; `SectionList` recicla linhas fora da área visível do Modal (`maxHeight: 420`)
em vez de montar todas de uma vez. Zero mudança visual (mesmo agrupamento, mesmos estilos).

**6. Pull-to-refresh na Home (pendência #21 fechada):** `RefreshControl` adicionado ao `ScrollView`
da Home, reaproveitando a mesma lógica de busca (`loadMap`/`loadChests`, extraídas do
`useEffect` original em vez de duplicadas) em vez de zerar `units`/baús e reacionar o
`LoadingBlueprint` de tela cheia — o spinner nativo do `RefreshControl` já é o indicador de
carregamento do gesto de puxar. **Pendência real do item #21 segue aberta**: ainda falta
re-verificar ao vivo, num device de verdade, se `LoadingBlueprint` respeita "Remover animações"
nesse fluxo especificamente — não testável nesta sessão (sem device conectado nem credenciais de
login disponíveis, ver limitação abaixo).

**Verificação:** `tsc --noEmit` limpo, `npx expo export --platform web` limpo (bundle gerado sem
erro). **Teste de UI ao vivo não foi possível nesta sessão** — mesma limitação já registrada nos
itens #16/#19 (sem credenciais da conta de teste disponíveis); `expo start --web` chegou a rodar e
foi verificado via Playwright headless, mas parou na tela de login (sem sessão), então só a tela de
login em si foi confirmada renderizando sem erro novo de console (só o warning `collapsable`
pré-existente do `react-native-svg` no alvo web, já documentado no item #15, não relacionado a esta
mudança). `TopAppBar`/`ThemeSelector` (que exigem sessão autenticada pra aparecer na Home) ficam
pendentes de confirmação visual ao vivo na próxima sessão com credenciais disponíveis.

**Pendências que seguem em aberto, fora do escopo desta demanda:**
- Espelhar as 6 mudanças acima em `apps/web` (regra permanente de paridade, item #9).
- Confirmar visualmente ao vivo (device ou `expo start --web` com login) a faixa única do
  `TopAppBar`, o `SectionList` do `ThemeSelector` e o gesto de pull-to-refresh.
- Re-verificar `LoadingBlueprint`/"Remover animações" no fluxo de pull-to-refresh (pendência #21).
- As Fases 4–6 do plano original (retomar checklist de teste em device, cobertura iOS/iPad,
  fechamento do ciclo) — ver `Docs/PENDENCIAS_TESTE_DEVICE.md` pro checklist consolidado.
