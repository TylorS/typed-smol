import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ["src/**/__tests__/**/*.{test,spec}.ts"],
    exclude: ["**/*.browser.test.ts", "**/node_modules/**", "**/dist/**"],
  },
});
