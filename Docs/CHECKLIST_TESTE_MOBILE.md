# Checklist de teste em device real — mobile (`apps/mobile`)

> Lista consolidada e **atualizada em 19/08/2026** — a versão anterior deste arquivo (17/08/2026)
> ficou desatualizada pelos PRs #107–#125, que já têm seus próprios checklists dentro de
> `Docs/PENDENCIAS_TESTE_DEVICE.md` (Lotes 5–9). Este arquivo só reagrupa tudo num lugar só pra
> rodar via `/loop`. Setup do ambiente (credenciais, como conectar via USB/`adb reverse`, gotcha do
> `EXPO_PUBLIC_API_BASE_URL`) está no topo de `PENDENCIAS_TESTE_DEVICE.md` — não duplicado aqui.
> Risque cada item conforme for testado; se algo falhar, anote o achado em `PENDENCIAS_MOBILE.md`
> (não aqui) e continue a lista.

## A. Confirmação visual — código já mudou, nunca visto rodando de verdade

### PR #106/#107 — Toggle/orientação/contraste/TopAppBar/ThemeSelector/pull-to-refresh (+ paridade web)
- [ ] `TopAppBar` (mobile e web <640px) em faixa única, sem borda duplicada entre seletor de tema e pílulas.
- [ ] Pull-to-refresh na Home funciona (spinner nativo, sem piscar pro skeleton fullscreen).
- [ ] Com "Remover animações" ligado, `LoadingBlueprint` respeita a preferência no reload do pull-to-refresh.
- [ ] `ThemeSelector` rola suave com `SectionList` (~50 itens).

### PR #115/#116 — Lote 7: `/impeccable critique`+`audit` (14 achados)
- [x] TalkBack: excluir conta usa botão comum (toque duplo) em vez de "segure 10s" quando o leitor de tela está ativo. **Confirmado 19/08/2026 no Redmi 13.**
- [x] TalkBack anuncia nome+estado em itens de lista (Notificações, Perfil, ranking de Liga, Materiais, cards de estatística). **Confirmado 19/08/2026.**
- [x] Celebração de nível fica na tela até fechar manualmente (não some sozinha em 1.5s). **Confirmado 19/08/2026.**
- [x] Fonte do sistema aumentada — frase de exclusão de conta e formulários (Login, Configurações, Reportar Bug) não cortam. **Confirmado 19/08/2026.**
- [x] Campos `Nome`/`Fuso horário`/`Nova senha`/busca são anunciados com rótulo pelo TalkBack. **Confirmado 19/08/2026.**
- [x] Cabeçalho de lição/Modo Infinito/conquista/resumo/Baú/chat fica visível abaixo da status bar/notch. **Confirmado 19/08/2026.**
- [x] `Toggle` e seletores de liga/divisão ficaram mais fáceis de acertar com o dedo. **Confirmado 19/08/2026.**
- [x] Gesto de voltar preditivo funciona em todas as telas empilhadas, inclusive saindo de uma sessão de quiz. **Confirmado 19/08/2026.**
- [x] Teclado do sistema não cobre o campo de digitação no chat de material nem no login. **Confirmado 19/08/2026.**
- [x] Fundo animado (`AnimatedBlueprintBackground`) não trava/perde frame durante o scroll do quiz. **Confirmado 19/08/2026.**
- [ ] Web: sino de notificações aparece na faixa inferior em telas <768px.
- [ ] Web: "Esqueci minha senha" chega, abre `/redefinir-senha`, troca funciona ponta a ponta.
- [ ] Web: contraste de `--color-error-red` sobre `--color-error-container` (ícone do `NoHeartsDialog`).
- [ ] Web: `prefers-reduced-motion` ativado — nada fica preso no meio de uma transição.

### PR #118/#119 — Lote 7B: pendências P2 fechadas
- [x] Recuperação de senha (mobile): "Esqueci minha senha" abre o app direto em `redefinir-senha.tsx`, troca de senha funciona ponta a ponta. **Confirmado 19/08/2026.**
- [ ] Formato do link do Supabase (`?code=` vs `#access_token=`) — confirmar qual chega de verdade.
- [x] `expo-image`: avatares (Perfil, Liga), imagem de questão, miniatura de print no Reportar Bug carregam normal. **Confirmado 19/08/2026.**
- [x] `FlatList` no chat de material rola pro fim sozinha a cada mensagem nova. **Confirmado 19/08/2026.**
- [ ] Web: `SideNav` desktop mostra só 5 itens (Home/Explorar/VIP/Liga/Perfil), Loja/Ajuda acessíveis via Perfil.

### PR #109/#110/#123/#124 — Lote 8: Idempotency-Key
- [x] Fluxo normal de resposta (Trilhas e Modo Infinito) continua idêntico, sem diferença perceptível. **Confirmado 19/08/2026.**
- [ ] Retry forçado (modo avião no meio de "Verificar", ou DevTools Offline no web) — XP/vidas/streak mudam só uma vez, não em dobro.

### PR #125/#133 — Lote 9: tema escuro (agora com toggle manual, padrão claro)
- [x] Modo claro por padrão ao abrir o app — nada deveria mudar. **Confirmado 19/08/2026.**
- [x] Ligar o tema escuro (toggle manual em Configurações → Aparência) troca a paleta ao vivo, sem reiniciar, nas 5 abas + Loja + Baú + Liga + Perfil + modais. **Confirmado 19/08/2026.**
- [ ] Fundo animado mantém contraste da grade/ícones no escuro — não verificado isoladamente ainda (nenhum problema relatado em geral, mas não citado explicitamente).
- [x] Badge/Toggle/Toast (cor "hardcoded por decisão" no DESIGN.md) — nenhum tom claro esquecido. **Confirmado 19/08/2026.**
- [ ] Splash screen — confirmar se "pisca" claro antes de assumir o tema escuro (esperado, não é bug) ou se incomoda.

## B. Testes funcionais ainda pendentes (mais antigos, nunca fechados)

### Lote 5 — fluxo de estudo completo
- [x] Lição inteira (10 perguntas) até "Lição Concluída!" — XP/precisão/sequência batem. **Confirmado 19/08/2026.**
- [ ] Errar de propósito e tocar "Explique melhor" — explicação do Groq aparece. **Bug real achado e corrigido no "Verificar" desta rodada (idempotência), "Explique melhor" em si ainda não reconfirmado.**
- [x] Modo Infinito — perguntas carregam, XP acumula até o teto diário. **Confirmado 19/08/2026.**
- [x] Notificações (sino) — abre e lista algo (ou empty state correto). **Confirmado 19/08/2026.**
- [x] VIP (`/vip`) — tela abre sem erro. **Confirmado 19/08/2026** (resgate de cupom com código válido de 10 dígitos ainda não testado).

### Lote 6 — edge cases
- [x] Girar pra paisagem — ignora a rotação (esperado, orientação travada em portrait por decisão registrada em `apps/mobile/DESIGN.md`). **Confirmado 19/08/2026.**
- [ ] Minimizar o app no meio de uma lição e voltar — progresso continua de onde parou.
- [ ] Desligar wifi no meio de uma compra — erro tratado ou trava.
- [ ] Nome de tema/trilha muito comprido — quebra o `ThemeSelector`.
- [ ] Fonte do sistema aumentada — textos cortam/sobrepõem.

### Outros
- [x] Gesto preditivo de voltar do Android. **Confirmado 19/08/2026** (device trocado pra modo de navegação por gestos).
- [ ] iOS/iPad — nada testado ainda (sem Mac/dispositivo Apple); decisão de quando entra em escopo.
- [ ] Diamante de checkpoint no mapa aparecendo laranja no device (código usa azul) — pedir print antes de mexer.

## C. Depois de fechar tudo acima
- [ ] Riscar cada item confirmado em `Docs/PENDENCIAS_TESTE_DEVICE.md` (Lotes 5–9) e `Docs/PENDENCIAS_MOBILE.md`.
- [ ] Apagar este arquivo quando o backlog acima estiver zerado.
