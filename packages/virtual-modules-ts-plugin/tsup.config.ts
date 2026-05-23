import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/plugin.ts"],
  format: ["cjs"],
  clean: true,
  outDir: "dist",
  splitting: false,
  noExternal: ["@typed/compiler", "@typed/virtual-modules"],
});
