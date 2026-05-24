import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { typedVitePlugin } from "../vite-plugin/src/index.js";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@typed/storybook",
        replacement: resolve(import.meta.dirname, "src/index.ts"),
      },
      {
        find: "@typed/vite-plugin",
        replacement: resolve(import.meta.dirname, "../vite-plugin/src/index.ts"),
      },
      {
        find: /^@typed\/app\/(.+)$/,
        replacement: `${resolve(import.meta.dirname, "../app/src")}/$1`,
      },
    ],
  },
  plugins: typedVitePlugin({
    compression: false,
    serverEntry: false,
    storybookVmOptions: {
      runtimeDefaults: {
        routes: ["./src/routes"],
        api: ["./src/api"],
        proxyPath: "/__typed_storybook_api",
        serverOrigin: "http://127.0.0.1:6173",
        baseDir: resolve(import.meta.dirname, "fixtures/public-beta"),
      },
    },
    templates: false,
    tsconfig: "tsconfig.test.json",
  }),
  ssr: {
    noExternal: [/^@typed\//],
  },
});
