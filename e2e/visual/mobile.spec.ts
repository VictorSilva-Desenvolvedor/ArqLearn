import { test, expect } from "@playwright/test";

test("home do apps/mobile (Expo Web) bate com o snapshot salvo", async ({ page }) => {
  await page.goto("/");
  await page.getByText("ArqLearn").first().waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("mobile-home.png", { fullPage: true });
});
