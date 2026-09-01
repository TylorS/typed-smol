import { defineConfig } from "vite";

const siteBase = () => {
  const value = process.env.SITE_BASE ?? "/";
  if (!value.startsWith("/")) throw new Error("SITE_BASE must start with '/'.");
  return value.endsWith("/") ? value : `${value}/`;
};

export default defineConfig(({ isSsrBuild }) => ({
  base: siteBase(),
  publicDir: false,
  build: isSsrBuild
    ? {
        outDir: "dist/server",
        emptyOutDir: true,
        target: "node24",
        sourcemap: true,
        rolldownOptions: {
          output: { entryFileNames: "server.js" },
        },
      }
    : {
        outDir: "dist/client",
        emptyOutDir: true,
        target: "es2022",
        sourcemap: true,
        rolldownOptions: {
          input: "src/client.ts",
          output: { entryFileNames: "client.js" },
        },
      },
}));
