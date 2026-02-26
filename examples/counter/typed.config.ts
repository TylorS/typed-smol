import { defineConfig } from "@typed/app";

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  server: {
    port: 3000,
    open: true,
  },
});
