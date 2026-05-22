import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBrowserVirtualModulePlugin } from "./index.js";

const tempDirs: string[] = [];

function createFixture(files: Readonly<Record<string, string>> = {}) {
  const root = mkdtempSync(join(process.cwd(), "tmp-browser-vm-"));
  tempDirs.push(root);
  const src = join(root, "src");
  mkdirSync(src, { recursive: true });
  const importer = join(src, "entry.browser.ts");
  writeFileSync(importer, "export {};", "utf8");
  for (const [path, text] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, text, "utf8");
  }
  return { root, importer };
}

const buildBrowser = (id: string, importer = createFixture().importer) =>
  createBrowserVirtualModulePlugin().build(id, importer, {} as never);

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("BrowserVirtualModulePlugin", () => {
  it("resolves valid typed:browser ids", () => {
    const plugin = createBrowserVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:browser?routes=*", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:browser?mode=hydrate", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:server?routes=./routes", "/project/src/entry.ts")).toBe(false);
  });

  it("emits composable run, hydrate, and BrowserRuntime exports for wildcard routes", () => {
    const source = buildBrowser("typed:browser?routes=*") as string;

    expect(source).toContain('import * as Cause from "effect/Cause";');
    expect(source).toContain('import * as Effect from "effect/Effect";');
    expect(source).toContain('import * as Layer from "effect/Layer";');
    expect(source).toContain('import { BrowserRouter, merge, type Matcher } from "@typed/router";');
    expect(source).toContain(
      'import { composeWithLayers, hydrate as hydrateRuntime, mount as mountRuntime, type LayerOrGroup } from "@typed/app";',
    );
    expect(source).not.toContain('import { DomRenderTemplate, render } from "@typed/template";');
    expect(source).toContain('import * as Routes0 from "router:./routes";');
    expect(source).toContain("export const BrowserRuntime =");
    expect(source).toContain("export function hydrate");
    expect(source).toContain("export function run");
    expect(source).toContain("Layer.launch(BrowserLayer");
    expect(source).toContain("const renderRuntime = BrowserRuntime.mode === \"mount\" ? mountRuntime : hydrateRuntime;");
    expect(source).toContain("Layer.effectDiscard(renderRuntime(Routes, { root }))");
    expect(source).toContain("Effect.tapCause");
    expect(source).toContain("options.layers");
    expect(source).toContain("options.onError");
    expect(source).not.toContain("Effect.succeed(BrowserRuntime)");
    expect(source).not.toContain("export async function run");
    expect(source).toContain('root: "#app"');
    expect(source).toContain('base: "/"');
    expect(source).toContain('mode: "hydrate"');
  });

  it("emits repeated explicit route imports in source order", () => {
    const source = buildBrowser("typed:browser?routes=./main&routes=./admin") as string;

    expect(source.indexOf('import * as Routes0 from "router:./main";')).toBeLessThan(
      source.indexOf('import * as Routes1 from "router:./admin";'),
    );
  });

  it("emits root, base, mode, and name options", () => {
    const source = buildBrowser(
      "typed:browser?routes=./routes&root=%23shell&base=/admin&mode=mpa&name=admin",
    ) as string;

    expect(source).toContain('root: "#shell"');
    expect(source).toContain('base: "/admin"');
    expect(source).toContain('mode: "mpa"');
    expect(source).toContain('name: "admin"');
  });

  it("imports entry-adjacent named browser companions when present", () => {
    const fixture = createFixture({
      "src/.dependencies.ts": "export const layers = [];",
      "src/.navigation.ts": "export const onNavigation = () => undefined;",
      "src/.errors.ts": "export const onError = () => undefined;",
    });
    const source = buildBrowser("typed:browser?routes=./routes", fixture.importer) as string;

    expect(source).toContain('import * as BrowserDependenciesCompanion from "./.dependencies";');
    expect(source).toContain('import * as BrowserNavigationCompanion from "./.navigation";');
    expect(source).toContain('import * as BrowserErrorsCompanion from "./.errors";');
    expect(source).toContain("BrowserDependenciesCompanion.layers");
    expect(source).toContain("BrowserErrorsCompanion.onError");
    expect(source).not.toContain("_browser");
  });

  it("returns parser diagnostics with the browser plugin name", () => {
    const result = buildBrowser("typed:browser?routes=*&mode=server") as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-BROWSER-002",
        message: 'typed:browser mode must be one of "hydrate", "mount", or "mpa"',
        pluginName: "typed-browser-virtual-module",
      },
    ]);
  });
});
