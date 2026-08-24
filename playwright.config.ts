import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/visual",
  fullyParallel: true,
  reporter: [["html", { outputFolder: "e2e/visual/report", open: "never" }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "web",
      testMatch: /web\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3000" },
    },
    {
      name: "mobile-web",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:8081" },
    },
  ],
});
