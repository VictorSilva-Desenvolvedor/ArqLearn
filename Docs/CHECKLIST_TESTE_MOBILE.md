# Checklist de teste em device real — mobile (`apps/mobile`)

> Lista consolidada de tudo que falta testar manualmente no app mobile, pra rodar via `/loop`.
> Ambiente/setup (credenciais, como conectar o device, EAS Update) já documentado em
> `Docs/PENDENCIAS_TESTE_DEVICE.md` — não duplicado aqui. Risque cada item conforme for testado;
> se algo falhar, anote o achado em `Docs/PENDENCIAS_MOBILE.md` (não aqui) e continue a lista.

## A. Verificação do PR #106 (Toggle/orientação/contraste/TopAppBar/ThemeSelector/pull-to-refresh)

Ainda sem confirmação visual ao vivo — feito só por leitura de código + `tsc`/`expo export` limpos.

- [ ] `TopAppBar`: seletor de tema e pílulas de streak/vidas/gemas aparecem como uma faixa única
      (um fundo, uma borda), sem uma borda extra separando as duas linhas.
- [ ] Os 6 alvos de toque do `TopAppBar` continuam todos clicáveis e do mesmo tamanho de antes
      (notificações, perfil, seletor de tema, streak, vidas, gemas).
- [ ] Borda das cards/inputs (`--color-outline-variant`) visivelmente um pouco mais escura que
      antes — comparar com uma versão anterior do app se possível.
- [ ] `ThemeSelector`: abrir o modal "Escolher tema", rolar a lista até o fim (~50 itens) — deve
      rolar suave, sem travar, mesmo agrupamento por semestre de antes.
- [ ] Puxar a Home pra baixo (pull-to-refresh) — aparece o spinner nativo, a tela atualiza
      (trilhas/baús), sem piscar pro skeleton de tela cheia (`LoadingBlueprint` fullscreen).
- [ ] Com "Remover animações" ligado (Ajustes > Acessibilidade), puxar pra atualizar de novo —
      confirmar se o comportamento do `LoadingBlueprint` respeita a preferência (pendência #21/#22
      de `PENDENCIAS_MOBILE.md` — nunca fechou com confirmação clara antes).
- [ ] `Toggle` (Notificações, Configurações) continua funcionando normalmente — nenhuma mudança de
      código nele nesta rodada, só de documentação; confirmar que nada quebrou.

## B. Lote 4 — mais telas (já enviado antes, retomar se ainda não respondido)

- [ ] Baú diário/semanal (toque num card na Home) abre normal?
- [ ] Perfil (avatar/ícone no topo) — estatísticas aparecem certinho, sem número quebrado/`undefined`?
- [ ] Liga (aba embaixo) — lista de ranking rola suave, sem cortar nome/avatar?
- [ ] Zere as vidas numa lição (erre repetidamente) — o diálogo de "sem vidas" aparece corretamente?
- [ ] Modo escuro do celular, se tiver — o app deveria continuar igual (sem dark mode implementado
      ainda é o resultado esperado, não um bug).

## C. Lote 5 — fluxo de estudo completo

- [ ] Complete uma lição inteira (10 perguntas) até "Lição Concluída!" — XP/precisão/sequência
      batem com o que você respondeu?
- [ ] Erre uma pergunta de propósito e toque em "Explique melhor" — a explicação do Groq aparece?
- [ ] Teste o Modo Infinito (Explorar → card de Modo Infinito, ou aba direta) — perguntas carregam,
      XP acumula até o teto diário?
- [ ] Notificações (sino no header) — a tela abre e lista algo (ou empty state correto)?
- [ ] VIP (`/vip`) — a tela de paywall/resgate de cupom abre sem erro?

## D. Lote 6 — edge cases

- [ ] Gire o celular pra paisagem (se possível) — o app trava, estica estranho, ou ignora a rotação?
      (lembrete: orientação está travada em `portrait` de propósito — ver `apps/mobile/DESIGN.md`)
- [ ] Minimize o app no meio de uma lição e volte — o progresso continua de onde parou?
- [ ] Desligue o wifi no meio de uma ação (ex.: comprando na loja) — dá erro tratado ou trava?
- [ ] Nome de tema/trilha muito comprido (se existir algum) — quebra o layout do `ThemeSelector`?
- [ ] Teste com o tamanho de fonte do sistema aumentado (Ajustes > Acessibilidade > Tamanho da
      fonte) — textos cortam ou sobrepõem em algum lugar?

## E. Pendências específicas mais antigas

- [ ] Gesto preditivo de voltar do Android (precisa trocar o device pra modo de navegação por
      gestos — o botão físico normal já foi validado, `PENDENCIAS_MOBILE.md` #20).
- [ ] Diamante de checkpoint no mapa: usuário reportou que aparece laranja no device, mas o código
      usa azul (`colors.primary`) — pedir print de tela antes de mexer em qualquer coisa
      (`PENDENCIAS_TESTE_DEVICE.md`, Lote 1).
- [ ] TalkBack anuncia o nó "Continuar lição" ao tocar?
- [ ] TalkBack anuncia valor das pílulas de sequência/vidas/gemas?
- [ ] Alvo de toque das pílulas do header parece mais fácil de acertar (depois da mudança de faixa
      única do item A)?
- [ ] Baú Diário abre a partir do card na Home?
- [ ] Perfil → Configurações abre e "Sair" funciona?

## F. Cobertura de plataforma ainda não testada

- [ ] iOS/iPad — nada testado até hoje (sem Mac/dispositivo Apple). Requer decisão de quando isso
      entra em escopo (hoje só Android via APK, `PENDENCIAS_MOBILE.md` #7).

## G. Depois de fechar os itens acima

- [ ] Espelhar no `apps/web` as mudanças do PR #106 (Toggle/TopAppBar/ThemeSelector — regra
      permanente de paridade, `PENDENCIAS_MOBILE.md` #9).
- [ ] Atualizar `Docs/PENDENCIAS_MOBILE.md`/`Docs/PENDENCIAS_TESTE_DEVICE.md` riscando cada item
      confirmado, e apagar este arquivo (ou a seção correspondente) quando tudo estiver validado.
