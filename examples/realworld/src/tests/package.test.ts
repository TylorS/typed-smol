import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");

const readText = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

const readJson = <A>(path: string): A => JSON.parse(readText(path)) as A;

type PackageJson = {
  readonly name: string;
  readonly type: string;
  readonly scripts: Record<string, string>;
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
};

describe("typed-realworld package skeleton", () => {
  it("declares only the approved runtime and development dependencies", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(pkg.name).toBe("typed-realworld");
    expect(pkg.type).toBe("module");

    expect(Object.keys(pkg.dependencies).sort()).toEqual([
      "@effect/sql-sqlite-node",
      "@typed/app",
      "@typed/async-data",
      "@typed/fx",
      "@typed/guard",
      "@typed/navigation",
      "@typed/router",
      "@typed/template",
      "@typed/ui",
      "effect",
      "micromark",
    ]);

    expect(Object.keys(pkg.devDependencies).sort()).toEqual([
      "@playwright/test",
      "@typed/tsconfig",
      "@typed/vite-plugin",
      "typescript",
      "vite",
      "vitest",
    ]);
  });

  it("exposes every required local workflow script", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(Object.keys(pkg.scripts).sort()).toEqual([
      "build",
      "db:migrate",
      "db:reset",
      "db:seed",
      "dev",
      "preview",
      "test",
      "test:api:hurl:local",
      "test:e2e:local",
      "test:integration",
      "test:ssr",
      "test:unit",
    ]);
  });

  it("contains the required config, entry, ignore, and asset files", () => {
    expect(readText(".gitignore")).toContain(".data/");
    expect(readText(".gitignore")).toContain("playwright-report/");
    expect(readText(".gitignore")).toContain("test-results/");
    expect(readText(".gitignore")).toContain(".hurl/");

    expect(readText("vmc.config.ts")).toContain("createRouterVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createHttpApiVirtualModulePlugin");
    expect(readText("vite.config.ts")).toContain("typedVitePlugin");
    expect(readText("typed.config.ts")).toContain("defineConfig");

    expect(existsSync(resolve(projectRoot, "index.html"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/main.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/server.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/browser.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "public/default-avatar.svg"))).toBe(true);
  });
});
