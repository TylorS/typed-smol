import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const workspaceRoot = resolve(projectRoot, "../..");
const apiSpecPath = ".temp/references/realworld/specs/api/hurl";
const e2eSpecPath = ".temp/references/realworld/specs/e2e";

describe("realworld local acceptance gates", () => {
  it("owns the full-stack local acceptance lifecycle behind one command", () => {
    const script = readText("scripts/run-acceptance-local.ts");
    const packageJson = readJson<{ readonly scripts: Record<string, string> }>("package.json");
    const typedConfig = readText("typed.config.ts");

    expect(packageJson.scripts["test:acceptance:local"]).toBe(
      "vmc -p tsconfig.json && node dist/types/scripts/run-acceptance-local.js",
    );
    expect(script).toContain("runDbReset");
    expect(script).toContain("runPreflight");
    expect(script).toContain("hurl is required");
    expect(script).toContain("startAppServer");
    expect(script).toContain("waitForServer");
    expect(script).toContain("runHurl");
    expect(script).toContain("runE2e");
    expect(script).toContain("stopAppServer");
    expect(script).toContain("127.0.0.1");
    expect(script).toContain("3000");
    expect(typedConfig).toContain('entry: "src/server.ts"');
  });

  it("runs Hurl through the upstream spec checkout instead of vendoring files", () => {
    const script = readText("scripts/run-hurl-local.ts");
    const packageJson = readJson<{ readonly scripts: Record<string, string> }>("package.json");

    expect(script).toContain(apiSpecPath);
    expect(script).toContain("HOST");
    expect(script).toContain("UID_VAL");
    expect(script).toContain("hurl is required");
    expect(packageJson.scripts["test:api:hurl:local"]).toContain("run-hurl-local");
    expect(existsSync(resolve(workspaceRoot, apiSpecPath, "auth.hurl"))).toBe(true);
    expect(localVendoredSpecFiles("hurl")).toEqual([]);
  });

  it("runs Playwright through the upstream e2e checkout instead of vendoring files", () => {
    const script = readText("scripts/run-e2e-local.ts");
    const config = readText("playwright.config.ts");
    const packageJson = readJson<{ readonly scripts: Record<string, string> }>("package.json");

    expect(script).toContain(e2eSpecPath);
    expect(script).toContain("APP_BASE");
    expect(script).toContain("API_BASE");
    expect(script).toContain("Playwright browsers are required");
    expect(config).toContain(e2eSpecPath);
    expect(config).toContain("baseURL");
    expect(packageJson.scripts["test:e2e:local"]).toContain("run-e2e-local");
    expect(existsSync(resolve(workspaceRoot, e2eSpecPath, "health.spec.ts"))).toBe(true);
    expect(localVendoredSpecFiles("e2e")).toEqual([]);
  });

  it("documents exact local commands and prerequisites", () => {
    const readme = readText("README.md");

    expect(readme).toContain("pnpm --filter typed-realworld test:acceptance:local");
    expect(readme).toContain("pnpm --filter typed-realworld test:api:hurl:local");
    expect(readme).toContain("pnpm --filter typed-realworld test:e2e:local");
    expect(readme).toContain("hurl");
    expect(readme).toContain("playwright install");
    expect(readme).toContain("HOST=");
    expect(readme).toContain("APP_BASE=");
    expect(readme).toContain("API_BASE=");
    expect(readme).not.toContain("src/browser-routes");
  });
});

const readText = (path: string): string =>
  readFileSync(resolve(projectRoot, path), "utf8");

const readJson = <A>(path: string): A => JSON.parse(readText(path));

const localVendoredSpecFiles = (name: "e2e" | "hurl"): readonly string[] => {
  const dir = resolve(projectRoot, "specs", name);
  return existsSync(dir) ? readdirSync(dir) : [];
};
