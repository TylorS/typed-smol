import { defineConfig } from "vite";

export default defineConfig(({ isSsrBuild }) => ({
  build: isSsrBuild
    ? {
        outDir: "dist/server",
        emptyOutDir: true,
        target: "node24",
        sourcemap: true,
        rollupOptions: {
          output: { entryFileNames: "server.js" },
        },
      }
    : {
        outDir: "dist/client",
        emptyOutDir: true,
        target: "es2022",
        sourcemap: true,
        rollupOptions: {
          input: "src/client.ts",
          output: { entryFileNames: "client.js" },
        },
      },
}));
