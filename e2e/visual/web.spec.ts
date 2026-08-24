import { test, expect } from "@playwright/test";

// ATENÇÃO — este teste NÃO cobre a Home. Ele se chamava "home do apps/web" e o baseline salvo
// era, na verdade, a tela de LOGIN: `/` é rota protegida (src/proxy.ts) e redireciona pra
// `/login` sem sessão, então a suíte vinha passando verde havia versões sobre um screenshot que
// nunca mostrou o Mapa de Aprendizado (achado da auditoria visual da Home, 24/08/2026).
// Renomeado pra dizer a verdade sobre o que cobre.
//
// A cobertura real da Home (e de qualquer rota dentro de `(shell)`) depende de uma sessão
// autenticada no Playwright — hoje não existe credencial de teste versionada no repositório.
// Ver Docs/UI_AUDIT_STATUS.md / Docs/PENDENCIAS_WEB_REAL.md: é uma decisão pendente do usuário
// (conta de teste dedicada em variável de ambiente vs. seed de sessão).
test("tela de login do apps/web bate com o snapshot salvo", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/login");
  await expect(page).toHaveScreenshot("web-login.png", { fullPage: true });
});
