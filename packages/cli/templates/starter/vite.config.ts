import { defineConfig } from "vite";
import { typedVitePlugin } from "@typed/vite-plugin";

export default defineConfig({
  appType: "custom",
  plugins: typedVitePlugin(),
});
