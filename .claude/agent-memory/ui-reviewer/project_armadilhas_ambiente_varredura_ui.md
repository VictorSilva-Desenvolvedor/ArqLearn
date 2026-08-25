---
name: armadilhas-ambiente-varredura-ui
description: Armadilhas de ambiente que invalidam silenciosamente uma auditoria visual neste projeto (porta 3000 sequestrada, screenshot fullPage mentindo sobre sticky/fixed, script Playwright fora do repo)
metadata:
  type: project
---

Três armadilhas que já produziram conclusão errada numa auditoria de tela:

1. **Porta 3000 sequestrada por um node.exe órfão.** O `next dev` cai calado pro 3001 e a suíte
   Playwright (baseURL fixo em `localhost:3000`) fotografa um "Cannot GET /" de outro processo e
   reporta 11% de diferença como se fosse regressão da tela. Sempre conferir
   `netstat -ano | grep ":3000 " | grep LISTEN` **antes** de rodar a suíte, e comparar com o PID
   do processo que você mesmo subiu.
2. **`fullPage: true` mente sobre elementos `sticky`/`fixed`.** Sidebar que "acaba no meio da
   página", fundo animado que "some" e bottom nav "atravessando o conteúdo" são artefatos do
   screenshot de página inteira, não defeitos. Confirmar qualquer suspeita desse tipo com
   screenshot de viewport + `window.scrollTo` antes de reportar.
3. **Script Playwright no diretório de scratchpad não resolve `@playwright/test`.** Importar por
   URL absoluta de arquivo (`file:///d:/.../node_modules/@playwright/test/index.mjs`) em vez de
   copiar o script pra dentro do repositório.
4. **`@playwright/test` pode nem estar em `node_modules`** (estava no `package.json` e no lock, mas
   ausente na árvore em 25/08/2026): `npm run test:visual` morre com `MODULE_NOT_FOUND`. `npm
   install` na raiz resolve sem mexer no lock. Antes disso, para script avulso de captura, o
   fallback que funciona é o pacote `playwright` cru do cache do npx —
   `await import("file:///C:/Users/victo/AppData/Local/npm-cache/_npx/<hash>/node_modules/playwright/index.mjs")`
   (achar o hash com `find "$LOCALAPPDATA/npm-cache/_npx" -maxdepth 4 -type d -name playwright`).
5. **`next dev` em background cai sozinho** neste harness (sai com código 1 depois de alguns
   minutos, mesmo sem erro no log). Conferir a porta antes de cada rodada de captura e reiniciar —
   não confundir a queda com falha da aplicação.

**Why:** 1–3 apareceram na varredura da Home (24/08/2026), 4–5 na varredura das telas B–G
(25/08/2026); as duas primeiras chegaram a virar "achado" antes de serem desmentidas.

**How to apply:** checar a porta antes de rodar `npm run test:visual`; nunca julgar
sticky/fixed/background por screenshot fullPage.

Relacionado: [[como-renderizar-home-autenticada]]
