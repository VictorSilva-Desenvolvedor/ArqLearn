# Pendências — teste ao vivo em device real (mobile)

> Checklist de continuidade: sessão de 17/08/2026 destravou teste em device Android real (dev
> client via EAS, ver histórico de commits — Expo Go da loja ficou incompatível com o SDK 57 do
> projeto) e rodou testes manuais guiados em lotes de 5. Este arquivo existe pra continuar exatamente
> de onde parou, de outro computador. Ambiente já configurado, não precisa refazer:
> - `apps/mobile/.env.local` já tem as credenciais Supabase reais.
> - `apps/web/.env.local` já tem `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
>   (mesmo projeto, reaproveitadas do mobile) — sem isso o `next dev` do web dá 500 em toda rota.
> - `expo-dev-client` já é dependência do projeto (`apps/mobile/package.json`).
> - O celular de teste (Android, modo de navegação por 3 botões) já tem o dev client instalado —
>   basta rodar `npx expo start --dev-client` (de dentro de `apps/mobile` ou via
>   `npm exec --workspace=apps/mobile -- expo start --dev-client`).
> - **O app instalado é o dev client, não o app final nem a Expo Go da loja.** Abrir o ícone sozinho
>   não conecta em nada automaticamente na primeira vez — cai na tela própria do dev client
>   (`DevLauncherActivity`, confirmado via `adb logcat`), com um campo "Enter URL manually". **EAS
>   Update (OTA) não tem efeito nenhum nesse app** — só builds standalone (perfil `preview`/
>   `production` sem dev client) leem o canal de update; publicar OTA pra testar no dev client é
>   inútil, não gera erro, só não faz nada visível.
> - **Conexão via Wi-Fi/LAN não foi confiável nesta sessão** (firewall com regra liberada pro
>   Node.js, mesma rede confirmada, e mesmo assim zero pacote chegou no Metro — causa não
>   identificada). **Caminho que funcionou: USB.** Ativar "Depuração USB" nas Opções do
>   desenvolvedor, autorizar o popup no celular ao plugar o cabo, depois:
>   `adb reverse tcp:8081 tcp:8081` (usa o `adb` de `platform-tools` do Android SDK; nesta máquina
>   não estava no PATH, caminho completo em
>   `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`) — digitar `localhost:8081` no campo do dev
>   client. Confirmar que o bundle chegou pelo log do Metro ("Android Bundled ... node_modules
>   expo-router\entry.js"), não só pela UI do celular.
> - **`EXPO_PUBLIC_API_BASE_URL` em `.env.local` aponta pra `http://localhost:8080`** — isso é o
>   `localhost` **do celular**, não desta máquina; só funciona se `services/monolith` estiver
>   rodando aqui **e** com `adb reverse tcp:8080 tcp:8080` também configurado. Sem isso, o app
>   conecta no Metro (bundle carrega) mas fica travado em "conectando"/loading pra sempre, tentando
>   falar com uma porta 8080 que não existe no celular — sintoma fácil de confundir com crash.
>   Caminho mais rápido pra testar sem subir o backend local: `EXPO_PUBLIC_API_BASE_URL=https://arqlearn.onrender.com
>   npx expo start --dev-client` (sobrescreve o valor do `.env.local`, que não é sobrescrito no
>   arquivo em si).
> - `@expo/ngrok` já é devDependency do projeto (`apps/mobile/package.json`) — necessário pra
>   `expo start --dev-client --tunnel` (alternativa ao USB se a rede Wi-Fi algum dia funcionar).
>   **Rodar sem `EXPO_TOKEN` no ambiente** — com o token presente (`.env.local` exporta ele por
>   padrão), o comando falha com `Cannot use ngrok with a robot user`.
> - Playwright já testado funcionando nesta máquina (binários do Chromium em cache local) — útil
>   pra tirar screenshot real do web (`npx playwright` funciona via `npx --yes -p playwright node
>   script.mjs`, já que o pacote não está instalado como dependência do projeto).

## Resultado dos testes já rodados

### Lote 1 — visual/cor (Home)
1. ✅ Nó da lição atual está azul (`CurrentLessonNode`) — confirmado.
2. ✅ Pílula de gemas no header está laranja — confirmado.
3. ✅ Badge "Em construção" legível — confirmado.
4. ✅ "Revisar Erros" como ghost + toast em vez de botão sólido mudo — confirmado.
5. ✅ Erro de rede mostra `ErrorBanner` com retry em vez de tela em branco — confirmado.

**Achado não resolvido**: usuário reportou que o **diamante de checkpoint** no mapa aparece
laranja no device. No código (`LessonNode.tsx`, variant `checkpoint`) ele usa `colors.primary`
(azul) desde antes desta sessão — nunca foi tocado. Usuário decidiu deixar como está por ora
("tá bom assim também"), mas a discrepância entre código e o que apareceu na tela **não foi
investigada a fundo**. Possíveis causas a checar na próxima sessão: build desatualizado no
celular (rodar update OTA ou novo build), algum outro elemento sendo confundido com o
"diamante" (o ícone de gemas em algum lugar?), ou um bug real ainda não encontrado. **Ação:
pedir print de tela na próxima sessão antes de mexer em qualquer coisa.**

### Lote 2 — acessibilidade e toque
**Só o item 5 foi respondido** (os itens 1-4 abaixo continuam sem confirmação — refazer):
1. ❓ TalkBack anuncia o nó "Continuar lição" ao tocar — **não confirmado**.
2. ❓ TalkBack anuncia valor das pílulas de sequência/vidas/gemas — **não confirmado**.
3. ❓ Alvo de toque das pílulas do header parece mais fácil de acertar — **não confirmado**.
4. ❓ Seletor de tema rola suave pelos ~50 temas — **não confirmado**.
5. ⚠️ Testado com o mecanismo errado (app não tem pull-to-refresh — achado e documentado como
   pendência #21 em `PENDENCIAS_MOBILE.md`). Depois de forçar reload trocando o tema, o resultado
   do teste de "Remover animações" **não fechou com confirmação clara** — ver pendência #21.

### Lote 3 — telas e navegação
**Só os itens 1, 2 e 5 foram respondidos** (itens 3 e 4 continuam sem confirmação — refazer):
1. 🔧 Lição "em construção" não dava feedback nenhum ao toque — **corrigido** (PR #103): agora
   mostra um toast explicando o estado. Continua não-navegável de propósito.
2. 🔧 Cards de trilha (Explorar) com alturas diferentes na mesma linha da grade — **corrigido**
   (PR #103): título agora trava em 2 linhas (`numberOfLines`).
3. ❓ Baú Diário abre a partir do card na Home — **não confirmado**.
4. ❓ Perfil → Configurações abre e "Sair" funciona — **não confirmado**.
5. 🔧 Itens cosméticos na Loja não respondiam ao toque — **corrigido** (PR #103, espelhado no web
   no PR #104): causa raiz era a conta de teste (340 gemas) não ter gemas suficientes pra nenhum
   item (500+) nem pro refil de vidas (350) — botão desabilitado e mudo. Agora mostra "Gemas
   insuficientes" visível.

### Lote 4 — mais telas
1. 🔧 Baú abria normal, mas contava resposta errada como progresso — **corrigido** (PR #109): agora
   só conta acerto. Regra também documentada em `ArqLearn_API_Specification.md` v1.20.
2. ✅ Perfil — estatísticas (XP Total, Sequência, Máximo, Gemas) confirmadas certinhas.
3. ❓ Liga (aba embaixo) — **não confirmado**, refazer.
4. 🔧 Diálogo de "sem vidas" abria, mas sem mostrar quanto tempo faltava pra próxima vida na
   prática — investigado (o componente existe, `HeartsCountdown`, só não tinha ficado claro que
   é preciso abrir o diálogo pra ver). No processo, mudou a regra em si: regeneração de vida
   passou de 3h/vida (15h pra encher tudo) pra 36min/vida (3h pra encher tudo) — **corrigido**
   (PR #110), confirmado funcionando.
5. ❓ Modo escuro do celular — **não confirmado**, refazer (esperado: app continua igual, sem
   dark mode implementado ainda).

## Lotes ainda não escritos/enviados — continuar a partir daqui

### Lote 5 — sugestão (fluxo de estudo completo)
1. ✅ Lição inteira (10 perguntas) até "Lição Concluída!" — **confirmado 19/08/2026**, XP/precisão/
   sequência batendo com o respondido.
2. ❓ Erre uma pergunta de propósito e toque em "Explique melhor" — a explicação do Groq aparece?
   **"Verificar" (submissão de resposta) achou e fechou um bug real de verdade nesta rodada — ver
   `PENDENCIAS_MOBILE.md` #23 — mas "Explique melhor" especificamente ainda não foi reconfirmado
   depois do fix.**
3. ✅ Modo Infinito — **confirmado 19/08/2026**, perguntas carregam e XP acumula.
4. ✅ Notificações (sino no header) — **confirmado 19/08/2026**.
5. VIP (`/vip`) — tela abre sem erro, **confirmado**; resgate de cupom não testado com um código
   válido de 10 dígitos ainda (usuário testou com um código curto de propósito, botão
   corretamente desabilitado — não é bug).

### Lote 6 — sugestão (edge cases)
1. ✅ Girar pra paisagem — **confirmado 19/08/2026**: ignora a rotação, continua em portrait
   (comportamento esperado, decisão documentada em `apps/mobile/DESIGN.md`).
2. Minimize o app no meio de uma lição e volte — o progresso continua de onde parou?
3. Desligue o wifi no meio de uma ação (ex.: comprando na loja) — dá erro tratado ou trava?
4. Nome de tema/trilha muito comprido (se existir algum) — quebra o layout do `ThemeSelector`?
5. Teste com o tamanho de fonte do sistema aumentado (Ajustes > Acessibilidade > Tamanho da
   fonte) — textos cortam ou sobrepõem em algum lugar?

### Lote 7 — confirmar correções do `/impeccable critique`+`audit` (18/08/2026)

Rodada completa de `/impeccable critique` + `/impeccable audit` (dual-agent, web e mobile) gerou
14 achados corrigidos em código só nesta sessão (PRs #115 web, #116 mobile) — nenhum foi testado
ao vivo ainda, porque não há device/browser autenticado disponível neste ambiente. Confirmar:

**Mobile — TalkBack real, fim a fim (Configurações → Zona de risco → Excluir conta):**
**[CONFIRMADO 19/08/2026]** Todos os 5 itens abaixo testados ao vivo com TalkBack real ligado no
device (Redmi 13) — usuário confirmou "funcionou 100%".
1. ✅ Ativar o TalkBack e tentar excluir a conta — o app mostra um botão comum (não mais o
   "segure 10s") quando o leitor de tela está ativo, funciona por toque duplo.
2. ✅ Itens de lista (Notificações, Perfil → menu, ranking de Liga, Materiais enviados, cards de
   estatística no resumo de lição) — TalkBack anuncia nome + estado coerente.
3. ✅ Celebração de nível continua na tela até fechar manualmente, não some sozinha em 1.5s.
4. ✅ Fonte do sistema aumentada — frase de confirmação de exclusão e textos dos formulários
   (Login, Configurações, Reportar Bug) continuam cabendo.
5. ✅ `Nome`/`Fuso horário`/`Nova senha`/campo de busca são anunciados pelo TalkBack com rótulo.

**Mobile — layout/insets:**
6. ✅ Cabeçalho de lição/Modo Infinito/conquista/resumo/Baú/chat visível abaixo da status bar/notch
   — **confirmado 19/08/2026**.
7. ✅ `Toggle` e seletores de liga/divisão — **confirmado 19/08/2026**, mais fáceis de acertar.
8. ✅ Gesto de voltar preditivo (Android, modo de navegação por gestos) em todas as telas
   empilhadas, inclusive saindo de dentro de uma sessão de quiz — **confirmado 19/08/2026**
   (Redmi 13, trocado pra modo de navegação por gestos pra este teste).
9. ✅ Teclado do sistema não cobre o campo de digitação no chat de material nem no login —
   **confirmado 19/08/2026**.
10. ✅ Fundo animado (`AnimatedBlueprintBackground`) rolando a tela de quiz — **confirmado
    19/08/2026**, sem travamento/perda de frame perceptível.

**Web — confirmar visualmente:**
11. `/login` numa tela <768px — o sino de notificações aparece na faixa inferior agora?
12. Peça "Esqueci minha senha" em `/login` com um e-mail real de teste — o link chega, abre
    `/redefinir-senha`, e a troca de senha funciona ponta a ponta? (Depende de configuração de
    redirect no painel do Supabase — não verificável só por código.)
13. Confirme com DevTools/axe o contraste de `--color-error-red` sobre `--color-error-container`
    (usado no ícone dentro do `NoHeartsDialog`).
14. `prefers-reduced-motion` ativado no SO — nenhum elemento (fundo animado, Toast, Modal, spinner)
    fica "preso" no meio de uma transição?

## O que fazer a seguir (fora do checklist de teste manual)

Itens que dependem de decisão de design ou de outro tipo de ambiente, não de mais teste manual:

1. ✅ **Densidade do `TopAppBar`** (mobile) — resolvido 17/08/2026 (`/impeccable layout`, ver
   `PENDENCIAS_MOBILE.md` #22): as duas faixas utilitárias viraram uma só, sem borda duplicada.
   **Falta**: confirmar visualmente ao vivo (sem credenciais de login disponíveis na sessão que
   fez a mudança).
2. ✅ **`ThemeSelector` sem virtualização de lista** — resolvido 17/08/2026 (`/impeccable
   optimize`, `PENDENCIAS_MOBILE.md` #22): `ScrollView` trocado por `SectionList`.
3. ✅ **Formato do `Toggle`** — resolvido 17/08/2026 (`/impeccable shape`, `PENDENCIAS_MOBILE.md`
   #22): mantido como estilo próprio da marca, documentado em `apps/mobile/DESIGN.md`.
4. ✅ **Lock de orientação** — resolvido 17/08/2026 (`/impeccable document`, `PENDENCIAS_MOBILE.md`
   #22): confirmado intencional (nenhuma tela tem composição landscape), motivo registrado em
   `apps/mobile/DESIGN.md`.
5. ✅ **Gesto preditivo de voltar do Android** — resolvido 19/08/2026: device trocado pra modo de
   navegação por gestos e testado em telas empilhadas (inclusive saindo de sessão de quiz),
   confirmado funcionando. Botão voltar normal já validado antes (`PENDENCIAS_MOBILE.md` #20).
6. ✅ **`--color-outline-variant` (borda)** — resolvido 17/08/2026 (`/impeccable audit` focado
   nisso, `PENDENCIAS_MOBILE.md` #22): media ~1.6:1, abaixo do mínimo 3:1 — replicado o fix já
   validado no web (`#c2c7d0` → `#7f8894`).
7. **iOS e iPad** — nada testado (sem Mac/dispositivo Apple nesta sessão). Todo achado de
   `/impeccable audit` referente a `ios.md`/adaptividade em tablet continua só verificado por
   leitura de código, nunca ao vivo.
8. 🔧 **Pull-to-refresh ausente na Home** — implementado 17/08/2026 (`PENDENCIAS_MOBILE.md` #22).
   **Falta**: re-verificar ao vivo se `LoadingBlueprint` respeita "Remover animações" no reload
   real (não testável sem device/credenciais na sessão que implementou) — mesma pendência #2 do
   achado original (`PENDENCIAS_MOBILE.md` #21).
9. **Espelhar no `apps/web`** as 6 mudanças do item #22 acima (regra permanente de paridade,
   `PENDENCIAS_MOBILE.md` #9) — avaliado 18/08/2026 (PR #107): das 6, só o `TopAppBar` se aplicava
   de verdade ao web (mesmo achado de 2 faixas empilhadas com borda duplicada em telas <640px,
   corrigido do mesmo jeito). As outras 5 não têm equivalente real no web: `ThemeSelector` já usa
   scroll nativo do navegador via Radix (sem o problema de performance do RN), `outline-variant` já
   tinha o valor correto no web desde antes (o mobile que copiou de lá), pull-to-refresh e lock de
   orientação são conceitos mobile-only, e `Toggle` já é o mesmo componente/estilo nas duas
   plataformas. **Falta**: confirmar visualmente ao vivo a faixa única do `TopAppBar` no web (sem
   credenciais de teste disponíveis nesta sessão, mesma limitação do lado mobile).

## Referências

- `Docs/PENDENCIAS_MOBILE.md` — itens #20 e #21 têm o detalhe completo dos dois achados já
  documentados nesta rodada de testes (predictive-back e pull-to-refresh).
- `.impeccable/critique/` e `.impeccable/audit/` — relatórios completos das rodadas de
  critique/audit que geraram a maior parte do backlog acima.
- PRs desta sessão, em ordem: #93–#104 (mobile: #93, #96, #99, #100, #103; web: #94, #95, #98,
  #104; ambos/skill: #97; docs: #101, #102). Continuação (18/08/2026): #110 (regen. de vidas),
  #112 (notificações push), #113/#114 (fundo animado), #115/#116 (`/impeccable critique`+`audit`
  completo — Lote 7 acima é a checklist de confirmação).
- **[RESOLVIDO 18/08/2026, PRs #118/#119]** As 4 pendências P2 que tinham ficado de fora do Lote 7
  (migração `Image`→`expo-image`, `FlatList` no chat, recuperação de senha no mobile, `SideNav` vs
  `BottomNavBar`) foram todas fechadas — a pedido explícito do usuário ("deixe 100%"). Ver Lote 7B
  abaixo pro que só dá pra confirmar ao vivo nelas.

### Lote 7B — confirmar o fechamento das pendências P2 (18/08/2026, PRs #118/#119)

1. ✅ **Recuperação de senha (mobile)** — **confirmado 19/08/2026**: "Esqueci minha senha" em
   `login.tsx` funciona ponta a ponta (e-mail chega, link abre o app direto em
   `redefinir-senha.tsx`, troca de senha funciona).
2. Confirme se o link do Supabase vem no formato `?code=` (PKCE) ou `#access_token=`/`#refresh_token=`
   (implícito) — o código trata os dois, mas só um vai aparecer de verdade contra o projeto real; se
   nenhum funcionar, capturar a URL exata recebida (`console.log` temporário em `tryEstablishSession`)
   pra depurar o formato.
3. **`expo-image`**: como é módulo nativo novo, só funciona depois de um build novo do dev client —
   confirmar que avatares (Perfil, ranking de Liga), a imagem de referência da questão, e a
   miniatura de print anexado em Reportar Bug continuam carregando normalmente.
4. **`FlatList` no chat**: mande várias mensagens seguidas no chat de material — a lista rola pro
   fim sozinha a cada mensagem nova (igual antes, com `ScrollView`)? Sem esse teste, `scrollToEnd`
   do `FlatList` pode se comportar diferente do `ScrollView` em conteúdo de altura variável.
5. **`SideNav` (web, desktop)**: confirmar visualmente que agora só mostra 5 itens (Home/Explorar/
   VIP/Liga/Perfil) e que Loja/Ajuda continuam alcançáveis a partir de Perfil.

### Lote 8 — `Idempotency-Key` em `submitAnswer`/`submitInfiniteModeAnswer` (18/08/2026)

Backend passou a exigir o cabeçalho `Idempotency-Key` nas duas rotas de resposta (lição e Modo
Infinito) e cacheia o resultado por chave em `answer_submissions` — um retry de rede com a mesma
chave devolve o mesmo resultado em vez de conceder XP/vidas/streak/baú/conquista em dobro (API
Spec §2.6/§6, v1.22). Cliente (mobile + web) gera a chave por tentativa de pergunta e reaproveita
em retries de `verify()`, renovando só ao avançar de pergunta.

1. **Fluxo normal**: responda perguntas em Trilhas e no Modo Infinito normalmente (mobile e web) —
   sem diferença perceptível nenhuma deveria aparecer; é o caso feliz que precisa continuar
   idêntico a antes.
2. **Retry de verdade**: mais difícil de forçar sem interceptar a rede (ex.: modo avião ligado no
   meio do toque em "Verificar", ou DevTools → Network → Offline no web) — responda, force a
   chamada a falhar uma vez, tente de novo com a mesma pergunta ainda selecionada. XP/vidas/streak
   devem mudar só uma vez, mesmo que a chamada tenha sido tentada duas vezes.
3. Sem teste ao vivo desta rodada (backend ainda não implantado no Render até este PR ser
   mergeado e a próxima implantação rodar) — mesmo aviso já dado pras mudanças de baú/vidas
   anteriores nesta sessão.

### Lote 9 — tema escuro no mobile (18/08/2026)

A pedido explícito do usuário, revertendo uma decisão anterior desta mesma sessão ("só confirmar,
não implementar agora" quando o report original foi feito). `app.json` (`userInterfaceStyle`) foi
de `"light"` fixo pra `"automatic"`; `apps/mobile/src/theme/tokens.ts` ganhou uma paleta escura
completa (`darkColors`) ao lado da clara (`lightColors`), e as ~88 telas/componentes que liam cor
foram migrados pra ler via `useColors()` (`apps/mobile/src/theme/useColors.ts`) em vez de um objeto
estático — ver `apps/mobile/DESIGN.md`, seção "Dark Theme", pro racional completo da derivação da
paleta. Todo par texto/fundo foi conferido por script de contraste (WCAG AA), mas **nada disso foi
visto numa tela de verdade** — a sessão que implementou não tinha device conectado.

**[RESOLVIDO 19/08/2026, PR #127]** `/impeccable audit` re-rodou a verificação de contraste
independentemente (esta era a única superfície do app ainda sem auditoria desde a última rodada,
#121/#122) e achou 1 gap real: `outlineVariant` do tema escuro só tinha sido checado contra
`surface`/`background`, não contra `surfaceBright`/`surfaceGray` (as superfícies reais onde a
borda aparece) — media 1.99:1/2.76:1 ali, abaixo do mínimo AA de 3:1. Corrigido pra `#828d9c`
(3.30:1/4.56:1). Resto confirmado limpo (23 pares de texto, migração completa, zero cor
hardcoded fora de `tokens.ts`). **Ainda falta confirmação visual ao vivo** — os itens 1-5 abaixo
continuam pendentes, isto foi só verificação computacional/de código.

1. Com o celular de teste em modo claro, o app deve continuar idêntico a antes (nenhuma diferença
   visual) — é o caso que não deveria ter mudado.
2. Force o celular pro modo escuro (ajustes do sistema) com o app aberto: toda tela precisa trocar
   de paleta sem reiniciar o app (RN atualiza `useColorScheme()` ao vivo). Percorrer pelo menos: as
   5 abas, uma sessão de lição, o Modo Infinito, Loja, Baú, Liga, Perfil e suas subtelas, e os
   modais (Baú, "Sem vidas", conquista, tiers de liga) — são as áreas com mais tokens de cor únicos.
3. Conferir especificamente: nenhum texto ilegível (cor de texto igual à do fundo por trás dela),
   nenhum ícone "sumindo" contra o novo fundo, o fundo animado "Blueprint"
   (`AnimatedBlueprintBackground.tsx`) mantém contraste da grade/ícones caindo no escuro.
4. Badges/Toggle/Toast — os únicos componentes com nota própria de cor "hardcoded por decisão" no
   `DESIGN.md` (ex.: seção Shapes/Toggle) — confirmar que não sobrou nenhum tom claro esquecido
   ali.
5. Splash screen (`expo-splash-screen`) não foi tocada nesta rodada — fica fora de escopo,
   confirmar se ela "pisca" claro antes do app assumir o tema escuro (comportamento esperado do
   Expo hoje, não é bug desta mudança) ou se incomoda a ponto de valer uma correção futura.
