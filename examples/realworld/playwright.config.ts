import { defineConfig } from "@playwright/test";
import { baseConfig } from "../../.temp/references/realworld/specs/e2e/playwright.base";

const e2eSpecPath = ".temp/references/realworld/specs/e2e";
const appBase = process.env.APP_BASE ?? "http://127.0.0.1:3000";

export default defineConfig({
  ...baseConfig,
  testDir: `../../${e2eSpecPath}`,
  outputDir: "test-results/realworld-e2e",
  reporter: "list",
  use: {
    ...baseConfig.use,
    baseURL: appBase,
  },
});
