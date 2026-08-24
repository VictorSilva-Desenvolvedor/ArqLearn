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

**Why:** as três apareceram na mesma execução (varredura da tela Home, 24/08/2026); as duas
primeiras chegaram a virar "achado" antes de serem desmentidas.

**How to apply:** checar a porta antes de rodar `npm run test:visual`; nunca julgar
sticky/fixed/background por screenshot fullPage.

Relacionado: [[como-renderizar-home-autenticada]]
