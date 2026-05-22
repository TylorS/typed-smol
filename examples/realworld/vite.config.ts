import { typedVitePlugin } from "@typed/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  plugins: [...typedVitePlugin()],
  build: {
    outDir: "dist/client",
    sourcemap: true,
    target: "es2022",
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: false,
  },
});
