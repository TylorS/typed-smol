"use strict";

const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const sampleRoot = path.resolve(__dirname, "..");
const entry = path.join(sampleRoot, "scripts", "router-plugin-entry.mjs");
const outDir = path.join(sampleRoot, "plugins");
const outFile = path.join(outDir, "router-plugin.cjs");

if (!fs.existsSync(entry)) {
  console.error("Entry not found:", entry);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: outFile,
    // Bundle @typed/app so the plugin loads in CJS (NodeModulePluginLoader uses require)
  })
  .then(() => {
    console.log("Built", outFile);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
