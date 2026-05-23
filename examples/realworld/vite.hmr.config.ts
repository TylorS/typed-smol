import { defineConfig } from "vite";
import { typedTemplateVitePlugin } from "../../packages/compiler/dist/template/templateVitePlugin.js";

export default defineConfig({
  publicDir: false,
  root: "src/tests/hmr",
  plugins: [typedTemplateVitePlugin()],
  server: {
    fs: {
      allow: ["../../.."],
    },
  },
});
