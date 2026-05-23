import { defineConfig } from "@playwright/test";

const appBase = process.env.APP_BASE ?? "http://127.0.0.1:3100";

export default defineConfig({
  outputDir: "test-results/realworld-hmr",
  reporter: "list",
  testDir: "src/tests/hmr",
  timeout: 30_000,
  use: {
    baseURL: appBase,
    trace: "retain-on-failure",
  },
});
