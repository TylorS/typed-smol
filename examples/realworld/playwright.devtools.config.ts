import { defineConfig, devices } from "@playwright/test";

const appBase = process.env.APP_BASE ?? "http://127.0.0.1:3200";

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  outputDir: "test-results/realworld-devtools",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "list",
  testDir: "src/tests/devtools",
  timeout: 30_000,
  use: {
    actionTimeout: 5_000,
    baseURL: appBase,
    navigationTimeout: 10_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
});
