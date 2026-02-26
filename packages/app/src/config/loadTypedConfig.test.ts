import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadTypedConfig } from "./loadTypedConfig.js";
import ts from "typescript";

const FIXTURE_ROOT = resolve(import.meta.dirname ?? __dirname, "__test_fixtures__");

function ensureFixtureDir() {
  if (!existsSync(FIXTURE_ROOT)) mkdirSync(FIXTURE_ROOT, { recursive: true });
}

function cleanFixtures() {
  if (existsSync(FIXTURE_ROOT)) rmSync(FIXTURE_ROOT, { recursive: true, force: true });
}

describe("loadTypedConfig", () => {
  beforeEach(() => {
    cleanFixtures();
    ensureFixtureDir();
  });

  afterEach(() => {
    cleanFixtures();
  });

  // TS-2: not-found when no config file exists
  it("returns not-found when no typed.config.ts exists", () => {
    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("not-found");
  });

  // TS-1: discovers and loads valid typed.config.ts
  it("loads a valid typed.config.ts", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default { entry: "server.ts", server: { port: 4000 } };`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");

    expect(result.config.entry).toBe("server.ts");
    expect(result.config.server?.port).toBe(4000);
    expect(result.path).toBe(join(FIXTURE_ROOT, "typed.config.ts"));
  });

  // TS-1: loads config with defineConfig pattern
  it("loads a config using defineConfig pattern", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      [
        `function defineConfig(c: any) { return c; }`,
        `export default defineConfig({`,
        `  router: { prefix: "r:" },`,
        `  api: { prefix: "a:", pathPrefix: "/api" },`,
        `  build: { outDir: "out", sourcemap: true },`,
        `});`,
      ].join("\n"),
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");

    expect(result.config.router?.prefix).toBe("r:");
    expect(result.config.api?.prefix).toBe("a:");
    expect(result.config.api?.pathPrefix).toBe("/api");
    expect(result.config.build?.outDir).toBe("out");
    expect(result.config.build?.sourcemap).toBe(true);
  });

  // TS-3: returns error on syntax error
  it("returns error when config has syntax errors", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default {{{ broken`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("error");
  });

  // TS-3: returns error when config exports non-object
  it("returns error when config exports a non-object", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default "not an object";`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("error");
    if (result.status !== "error") throw new Error("unreachable");
    expect(result.message).toContain("Invalid config export");
  });

  it("returns error when projectRoot does not exist", () => {
    const result = loadTypedConfig({
      projectRoot: join(FIXTURE_ROOT, "nonexistent"),
      ts,
    });
    expect(result.status).toBe("error");
  });

  it("loads config via explicit configPath", () => {
    const customDir = join(FIXTURE_ROOT, "custom");
    mkdirSync(customDir, { recursive: true });
    writeFileSync(
      join(customDir, "my-config.ts"),
      `export default { entry: "custom.ts" };`,
    );

    const result = loadTypedConfig({
      projectRoot: FIXTURE_ROOT,
      ts,
      configPath: "custom/my-config.ts",
    });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");
    expect(result.config.entry).toBe("custom.ts");
  });

  // TS-13: config loading is synchronous
  it("loading is synchronous (no Promise returned)", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default {};`,
    );
    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result).not.toBeInstanceOf(Promise);
    expect(result.status).toBe("loaded");
  });

  it("loads empty config successfully", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default {};`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");
    expect(result.config).toEqual({});
  });

  it("loads config with test section", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default {
        test: {
          include: ["src/**/*.test.ts"],
          globals: true,
          coverage: { provider: "v8" },
        },
      };`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");
    expect(result.config.test?.include).toEqual(["src/**/*.test.ts"]);
    expect(result.config.test?.globals).toBe(true);
    expect(result.config.test?.coverage?.provider).toBe("v8");
  });

  it("loads config with lint and format sections", () => {
    writeFileSync(
      join(FIXTURE_ROOT, "typed.config.ts"),
      `export default {
        lint: {
          categories: { correctness: "error" },
          fix: true,
        },
        format: {
          printWidth: 100,
          singleQuote: true,
        },
      };`,
    );

    const result = loadTypedConfig({ projectRoot: FIXTURE_ROOT, ts });
    expect(result.status).toBe("loaded");
    if (result.status !== "loaded") throw new Error("unreachable");
    expect(result.config.lint?.categories).toEqual({ correctness: "error" });
    expect(result.config.lint?.fix).toBe(true);
    expect(result.config.format?.printWidth).toBe(100);
    expect(result.config.format?.singleQuote).toBe(true);
  });
});
