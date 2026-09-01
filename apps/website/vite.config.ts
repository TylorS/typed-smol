import { defineConfig } from "vite";

export const deploymentBase = "/typed-smol/";

const siteBase = () => {
  const value = process.env.SITE_BASE ?? deploymentBase;
  if (!value.startsWith("/")) throw new Error("SITE_BASE must start with '/'.");
  return value.endsWith("/") ? value : `${value}/`;
};

export default defineConfig(({ isSsrBuild }) => {
  const name = isSsrBuild ? "server" : "client";

  return {
    base: siteBase(),
    publicDir: false,
    build: {
      outDir: `dist/${name}`,
      emptyOutDir: true,
      target: "es2022",
      sourcemap: true,
      rolldownOptions: {
        input: `src/${name}.ts`,
        output: { entryFileNames: `${name}.js` },
      },
    },
  };
});
