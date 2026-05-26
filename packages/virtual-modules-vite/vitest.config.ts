import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@typed/virtual-modules": resolve(import.meta.dirname, "../virtual-modules/src/index.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
  },
});
