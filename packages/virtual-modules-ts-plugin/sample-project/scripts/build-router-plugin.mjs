import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleRoot = path.resolve(__dirname, "..");
const outDir = path.join(sampleRoot, "plugins");
const routerEntry = path.join(sampleRoot, "scripts", "router-plugin-entry.mjs");
const httpapiEntry = path.join(sampleRoot, "scripts", "httpapi-plugin-entry.mjs");
const routerOut = path.join(outDir, "router-plugin.mjs");
const httpapiOut = path.join(outDir, "httpapi-plugin.mjs");

if (!existsSync(routerEntry)) {
  console.error("Entry not found:", routerEntry);
  process.exit(1);
}
if (!existsSync(httpapiEntry)) {
  console.error("Entry not found:", httpapiEntry);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const buildConfig = {
  bundle: true,
  format: "esm",
  platform: "node",
  // Avoid "Dynamic require of fs is not supported" - keep these as runtime imports
  external: ["typescript", "node:fs", "node:path", "fs", "path"],
};

try {
  await esbuild.build({
    ...buildConfig,
    entryPoints: [routerEntry],
    outfile: routerOut,
  });
  console.log("Built", routerOut);

  await esbuild.build({
    ...buildConfig,
    entryPoints: [httpapiEntry],
    outfile: httpapiOut,
  });
  console.log("Built", httpapiOut);
} catch (err) {
  console.error(err);
  process.exit(1);
}
