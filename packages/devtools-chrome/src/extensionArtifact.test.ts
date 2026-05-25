import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const packageRoot = new URL("..", import.meta.url).pathname;
const extensionRoot = join(packageRoot, ".tmp/devtools-chrome-extension");

describe("Chrome extension artifact", () => {
  it("builds a loadable MV3 DevTools extension root", () => {
    const result = spawnSync("pnpm", ["run", "build:extension"], {
      cwd: packageRoot,
      encoding: "utf8",
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(readJson("manifest.json")).toMatchObject({
      background: { service_worker: "background.js", type: "module" },
      devtools_page: "devtools.html",
      manifest_version: 3,
      name: "Typed DevTools",
    });

    for (const file of [
      "devtools.html",
      "panel.html",
      "elementsSidebar.html",
      "sourcesSidebar.html",
      "icons/typed-devtools-32.png",
      "devtools.js",
      "panel.js",
      "background.js",
    ]) {
      expect(existsSync(join(extensionRoot, file)), file).toBe(true);
    }
  });
});

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(extensionRoot, file), "utf8"));
}
