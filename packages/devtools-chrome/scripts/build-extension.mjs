import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const extensionRoot = join(packageRoot, ".tmp/devtools-chrome-extension");

await rm(extensionRoot, { force: true, recursive: true });
await mkdir(join(extensionRoot, "icons"), { recursive: true });

await build({
  absWorkingDir: packageRoot,
  bundle: true,
  entryNames: "[name]",
  entryPoints: {
    background: "src/extension/background.ts",
    devtools: "src/extension/devtools.ts",
    panel: "src/panel/app.ts",
  },
  format: "esm",
  logLevel: "silent",
  outdir: extensionRoot,
  platform: "browser",
  sourcemap: false,
  target: "es2022",
});

await Promise.all([
  writeJson("manifest.json", {
    background: {
      service_worker: "background.js",
      type: "module",
    },
    devtools_page: "devtools.html",
    icons: {
      32: "icons/typed-devtools-32.png",
    },
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArL7WQpE9fcnIhAu1xFY13mIz8AMw/9tdScIZwRirr5fTwEf27WKptSGcwVpRxiLIGK1wBfDfNZ5LBHbQDwwfSU+sryT+TbcZlLrkpk4bwABG95lQgma0gA4jBtmc44mYQE73xfBn3vflw3OXr3r4rvhZkKWid+GmOeJM7Nqhu7g6VDsrb4qCzRrNqHcSJDozhwQ1gzIF9MpmcO8d4GgNrGxiaRLpg8Z0qEGJDWxrEvJODngAi2tvfsh9YxSm0l/yZBKokcTdWeP6JF08O/xDoq2V4EqgBd5x+g8K9jApckfKz8gvHjX8rqpnHWuc+8kO/yJZUJ+Q7Ru/zVcEiR/t5QIDAQAB",
    manifest_version: 3,
    name: "Typed DevTools",
    permissions: ["scripting"],
    version: "0.1.0",
  }),
  writeHtml("devtools.html", "devtools.js"),
  writeHtml("panel.html", "panel.js"),
  writeHtml("elementsSidebar.html", "panel.js"),
  writeHtml("sourcesSidebar.html", "panel.js"),
  writeIcon("icons/typed-devtools-32.png"),
]);

async function writeJson(path, value) {
  await writeFile(join(extensionRoot, path), `${JSON.stringify(value, null, 2)}\n`);
}

async function writeHtml(path, script) {
  await writeFile(
    join(extensionRoot, path),
    [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      "<meta http-equiv=\"Content-Security-Policy\" content=\"script-src 'self'; object-src 'self';\">",
      "<title>Typed DevTools</title>",
      "</head>",
      "<body>",
      '<div id="typed-devtools-root"></div>',
      `<script type="module" src="./${script}"></script>`,
      "</body>",
      "</html>",
      "",
    ].join("\n"),
  );
}

async function writeIcon(path) {
  const transparentPng =
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGUlEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AADiAAAQ0x+8QAAAAASUVORK5CYII=";
  await writeFile(join(extensionRoot, path), Buffer.from(transparentPng, "base64"));
}
