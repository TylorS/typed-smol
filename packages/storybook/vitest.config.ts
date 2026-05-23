import { defineConfig } from "vitest/config";
import { typedVitePlugin } from "@typed/vite-plugin";

export default defineConfig({
  plugins: typedVitePlugin({
    compression: false,
    serverEntry: false,
  }),
});
