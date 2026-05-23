import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        root: dirname,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookUrl: "http://127.0.0.1:6173",
            storybookScript:
              "pnpm exec storybook dev --config-dir fixtures/public-beta/.storybook --port 6173 --ci --no-open",
          }),
        ],
        optimizeDeps: {
          include: [
            "effect/unstable/http/FetchHttpClient",
            "effect/unstable/httpapi/HttpApi",
            "effect/unstable/httpapi/HttpApiClient",
            "effect/unstable/httpapi/HttpApiEndpoint",
            "effect/unstable/httpapi/HttpApiGroup",
            "effect/unstable/httpapi/OpenApi",
          ],
        },
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
