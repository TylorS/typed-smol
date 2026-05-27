import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");
const smokeBrowserPath = resolve(root, "src/browser.devtools.ts");
const smokeHtmlPath = resolve(root, "index.devtools.html");

describe("RealWorld DevTools smoke mode", () => {
  it("keeps the browser entrypoint on the default production virtual module", () => {
    const source = readFileSync(resolve(root, "src/browser.ts"), "utf8");

    expect(source).toContain("typed:browser?routes=./routes");
    expect(source).not.toContain("typed:browser?routes=./routes&devtools=1");
    expect(source).not.toContain("devtools:");
  });

  it("adds a dedicated smoke browser entrypoint with devtools enabled", () => {
    expect(existsSync(smokeBrowserPath), "missing src/browser.devtools.ts").toBe(true);
    expect(existsSync(smokeHtmlPath), "missing index.devtools.html").toBe(true);

    const smokeSource = readFileSync(smokeBrowserPath, "utf8");
    const smokeHtml = readFileSync(smokeHtmlPath, "utf8");

    expect(smokeSource).toContain("typed:browser?routes=./routes&devtools=1");
    expect(smokeSource).not.toContain('typed:browser?routes=./routes";');
    expect(smokeHtml).toContain("/src/browser.devtools.ts");
    expect(smokeHtml).not.toContain("/src/browser.ts");
  });

  it("declares a local devtools smoke script without changing the default dev script", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    const devtoolsCommand =
      "pnpm --filter @typed/app build && vmc -p tsconfig.json && node dist/types/scripts/run-devtools-local.js";

    expect(pkg.scripts.dev).toBe("typed dev");
    expect(pkg.scripts["devtools:local"]).toBe(devtoolsCommand);
    expect(pkg.scripts["test:devtools:local"]).toBe(devtoolsCommand);
    expect(existsSync(resolve(root, "scripts/run-devtools-local.ts"))).toBe(true);
  });
});
