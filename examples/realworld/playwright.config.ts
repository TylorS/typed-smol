import { defineConfig, devices } from "@playwright/test";

const e2eSpecPath = ".temp/references/realworld/specs/e2e";
const appBase = process.env.APP_BASE ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: `../../${e2eSpecPath}`,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  outputDir: "test-results/realworld-e2e",
  reporter: "list",
  timeout: 15_000,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    baseURL: appBase,
  },
  expect: {
    timeout: 5_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
