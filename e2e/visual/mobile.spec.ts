import { test, expect } from "@playwright/test";

// ATENÇÃO — este teste NÃO cobre a Home. Ele se chamava "home do apps/mobile" e o baseline salvo
// era, na verdade, a tela de BOAS-VINDAS pré-login (logo + "Começar agora" / "Já tenho uma
// conta"): o mobile só tem sessão real via Supabase Auth, sem modo demonstração, então a suíte
// vinha passando verde sobre um screenshot que nunca mostrou o Mapa de Aprendizado (achado da
// auditoria visual da Home, 24/08/2026). Renomeado pra dizer a verdade sobre o que cobre.
//
// A cobertura real da Home depende de uma sessão autenticada no Playwright — hoje não existe
// credencial de teste versionada no repositório. Ver Docs/UI_AUDIT_STATUS.md /
// Docs/PENDENCIAS_MOBILE.md.
test("tela de boas-vindas do apps/mobile (Expo Web) bate com o snapshot salvo", async ({ page }) => {
  await page.goto("/");
  await page.getByText("ArqLearn").first().waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("mobile-boas-vindas.png", { fullPage: true });
});
