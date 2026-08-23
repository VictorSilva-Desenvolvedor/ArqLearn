import { test, expect } from "@playwright/test";

test("home do apps/web bate com o snapshot salvo", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("web-home.png", { fullPage: true });
});
