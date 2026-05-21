import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBrowserVirtualModulePlugin } from "./index.js";
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";

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

    expect(source).not.toContain("// @ts-nocheck");
    expect(source).toContain('import * as Cause from "effect/Cause";');
    expect(source).toContain('import * as Effect from "effect/Effect";');
    expect(source).toContain('import * as Layer from "effect/Layer";');
    expect(source).toContain(
      'import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    );
    expect(source).not.toContain("TypedAppRuntime");
    expect(source).not.toContain('from "@typed/app";');
    expect(source).toContain('import * as TypedRouter from "@typed/router";');
    expect(source).toContain('import { Fx } from "@typed/fx";');
    expect(source).toContain('import { DomRenderTemplate, render } from "@typed/template";');
    expect(source).toContain('import Routes0 from "typed:router?dir=*";');
    expect(source).not.toContain("route-handlers:");
    expect(source).toContain("export const Routes = Routes0;");
    expect(source).not.toContain("export const Routes = TypedRouter.merge(Routes0);");
    expect(source).toContain("export const BrowserRuntime =");
    expect(source).not.toContain("type BrowserProgram");
    expect(source).toContain("type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;");
    expect(source).toContain("type BrowserLayerInputs = readonly LayerOrGroup[];");
    expect(source).toContain(
      "type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;",
    );
    expect(source).toContain("function makeRenderLayer");
    expect(source).toContain("export function hydrate");
    expect(source).toContain("export function run");
    expect(source).toContain("Fx.drainLayer(render(Routes, root))");
    expect(source).toContain("Layer.launch(BrowserLayer");
    expect(source).toContain("Effect.tapCause");
    expect(source).toContain("function withErrorHandling<A, E, R>");
    expect(source).not.toContain("Effect.Effect<void, any, never>");
    expect(source).not.toContain("Context.empty() as");
    expect(source).not.toContain("Cause.Cause<any>");
    expect(source).toContain("options.layers");
    expect(source).toContain("options.onError");
    expect(source).not.toContain("options.run");
    expect(source).not.toContain("readonly run?");
    expect(source).not.toContain("Effect.Effect<never, unknown");
    expect(source).not.toContain("Effect.Effect<unknown, unknown");
    expect(source).not.toContain("Effect.succeed(BrowserRuntime)");
    expect(source).not.toContain("export async function run");
    expect(source).toContain('root: "#app"');
    expect(source).toContain('base: "/"');
    expect(source).toContain('mode: "hydrate"');
  });

  it("type-checks generated browser entry source without ts-nocheck", () => {
    const fixture = createFixture({
      "src/routes.ts": "const routes: any = {};\nexport default routes;\n",
      "src/typed-app.d.ts": [
        'declare module "@typed/app/runtime" {',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Layer<never, unknown, unknown>;",
        "  export type LayerOrGroup = LayerAny;",
        "  export type ComputeLayers<Layers extends ReadonlyArray<LayerOrGroup>, Base extends LayerAny> = Base;",
        "  export function composeWithLayers<Base extends LayerAny, const Layers extends ReadonlyArray<LayerOrGroup>>(base: Base, layers?: Layers): ComputeLayers<Layers, Base>;",
        "}",
      ].join("\n"),
      "src/typed-template.d.ts": [
        'declare module "@typed/template" {',
        '  import type { Fx } from "@typed/fx";',
        '  import type * as Layer from "effect/Layer";',
        "  export const DomRenderTemplate: { readonly using: (document: Document) => Layer.Layer<never, never, never> };",
        "  export function render(input: any, root: HTMLElement): Fx<never, never, never>;",
        "}",
      ].join("\n"),
    });
    const source = buildBrowser("typed:browser?routes=./routes", fixture.importer) as string;
    const result = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/generated.browser.ts",
      sourceText: source,
      rootFiles: [
        fixture.importer,
        join(fixture.root, "src/routes.ts"),
        join(fixture.root, "src/typed-app.d.ts"),
        join(fixture.root, "src/typed-template.d.ts"),
      ],
      moduleFallbacks: {
        "typed:router?dir=./routes": join(fixture.root, "src/routes.ts"),
        "@typed/app/runtime": join(fixture.root, "src/typed-app.d.ts"),
        "@typed/template": join(fixture.root, "src/typed-template.d.ts"),
      },
    });

    expect(result.diagnostics).toEqual([]);
  });

  it("emits repeated explicit route imports in source order", () => {
    const source = buildBrowser("typed:browser?routes=./main&routes=./admin") as string;

    expect(source.indexOf('import Routes0 from "typed:router?dir=./main";')).toBeLessThan(
      source.indexOf('import Routes1 from "typed:router?dir=./admin";'),
    );
    expect(source).toContain("export const Routes = TypedRouter.merge(Routes0, Routes1);");
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
