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
      "@typed/virtual-modules-compiler",
      "@typed/vite-plugin",
      "@types/node",
      "typescript",
      "vite",
      "vitest",
    ]);
  });

  it("exposes every required local workflow script", () => {
    const pkg = readJson<PackageJson>("package.json");

    expect(pkg.scripts.build).toContain("vmc -p tsconfig.json");
    expect(pkg.scripts["db:migrate"]).toContain("vmc -p tsconfig.json");

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
    expect(readText("vmc.config.ts")).toContain("createConfigVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createHtmlVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createBrowserVirtualModulePlugin");
    expect(readText("vmc.config.ts")).toContain("createServerVirtualModulePlugin");
    expect(existsSync(resolve(projectRoot, "src/types/typed-virtual-modules.d.ts"))).toBe(false);
    expect(readText("vite.config.ts")).toContain("typedVitePlugin");
    expect(readText("typed.config.ts")).toContain("defineConfig");

    expect(existsSync(resolve(projectRoot, "index.html"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/main.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/server.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "src/browser.ts"))).toBe(true);
    expect(existsSync(resolve(projectRoot, "public/default-avatar.svg"))).toBe(true);
  });

  it("does not use unknown as an Effect error channel in production source", () => {
    const offenders = productionSourceFiles()
      .flatMap((path) =>
        effectUnknownErrorChannelLines(path).map((line) => `${path}:${line}`));

    expect(offenders).toEqual([]);
  });
});

const productionSourceFiles = (): readonly string[] => [
  "src/api-support/Common.ts",
  "src/application/Articles.ts",
  "src/application/Comments.ts",
  "src/application/Profiles.ts",
  "src/application/Tags.ts",
  "src/application/Users.ts",
  "src/presentation/FormEvents.ts",
];

const effectUnknownErrorChannelLines = (path: string): readonly number[] =>
  readText(path)
    .split("\n")
    .flatMap((line, index) =>
      /Effect(?:\.Effect)?<[^>\n,]+,\s*unknown(?:\s*[>,])/.test(line) ? [index + 1] : []);
