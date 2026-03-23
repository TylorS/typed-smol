import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/*.browser.test.ts", "**/node_modules/**", "**/dist/**"],
  },
});
