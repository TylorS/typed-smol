import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { typedVitePlugin } from "@typed/vite-plugin";

export default defineConfig({
  resolve: {
    alias: {
      "@typed/storybook": resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  plugins: typedVitePlugin({
    compression: false,
    serverEntry: false,
    templates: false,
    tsconfig: "tsconfig.test.json",
  }),
  ssr: {
    noExternal: [/^@typed\//],
  },
});
