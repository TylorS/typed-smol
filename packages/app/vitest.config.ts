import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: "v8",
      include: ["src/RouterVirtualModulePlugin.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "**/node_modules/**"],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        lines: 90,
        branches: 75,
      },
    },
  },
});
