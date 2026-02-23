import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleRoot = path.resolve(__dirname, "..");
const entry = path.join(sampleRoot, "scripts", "router-plugin-entry.mjs");
const outDir = path.join(sampleRoot, "plugins");
const outFile = path.join(outDir, "router-plugin.mjs");

if (!existsSync(entry)) {
  console.error("Entry not found:", entry);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

try {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: outFile,
    // Bundle @typed/app so the plugin can be loaded as a sync ESM module.
  });
  console.log("Built", outFile);
} catch (err) {
  console.error(err);
  process.exit(1);
}
