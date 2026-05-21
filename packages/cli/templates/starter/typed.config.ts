import { defineConfig } from "@typed/app/config/defineConfig";

export default defineConfig({
  entry: "packages/app/src/entry.server.ts",
  api: { pathPrefix: "/api" },
  build: {
    clientOutDir: "dist/client",
    serverOutDir: "dist/server",
    outDir: "dist",
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
  compression: false,
});
