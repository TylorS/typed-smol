import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createServerVirtualModulePlugin } from "./index.js";
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";

const tempDirs: string[] = [];

function createFixture(files: Readonly<Record<string, string>> = {}) {
  const root = mkdtempSync(join(process.cwd(), "tmp-server-vm-"));
  tempDirs.push(root);
  const src = join(root, "src");
  mkdirSync(src, { recursive: true });
  const importer = join(src, "entry.server.ts");
  writeFileSync(importer, "export {};", "utf8");
  for (const [path, text] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, text, "utf8");
  }
  return { root, importer };
}

const buildServer = (id: string, importer = createFixture().importer) =>
  createServerVirtualModulePlugin().build(id, importer, {} as never);

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("ServerVirtualModulePlugin", () => {
  it("resolves valid typed:server ids", () => {
    const plugin = createServerVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:server?api=./api", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:server?name=app", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:browser?routes=*", "/project/src/entry.ts")).toBe(false);
  });

  it("emits composable run, handler, and ServerLayer exports for APIs and routes", () => {
    const source = buildServer("typed:server?api=./api&routes=./routes1&routes=./routes2") as string;

    expect(source).not.toContain("// @ts-nocheck");
    expect(source).toContain('import * as Cause from "effect/Cause";');
    expect(source).toContain('import * as Context from "effect/Context";');
    expect(source).toContain('import * as Effect from "effect/Effect";');
    expect(source).toContain('import * as Layer from "effect/Layer";');
    expect(source).toContain('import * as HttpRouter from "effect/unstable/http/HttpRouter";');
    expect(source).toContain('import { pathToFileURL } from "node:url";');
    expect(source).toContain('import { TypedHttpServer } from "@typed/app/TypedHttpServer";');
    expect(source).toContain(
      'import { composeWithLayers, Ids, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    );
    expect(source).not.toContain('from "@typed/app";');
    expect(source).toContain('import * as TypedRouter from "@typed/router";');
    expect(source).toContain('import { ssrForHttp } from "@typed/ui";');
    expect(source).toContain('import * as Api0 from "typed:api?dir=./api";');
    expect(source).toContain('import Routes0 from "typed:router?dir=./routes1";');
    expect(source).toContain('import Routes1 from "typed:router?dir=./routes2";');
    expect(source).not.toContain("route-handlers:");
    expect(source).not.toContain("RouteHandlers.apply");
    expect(source).toContain("const routeModules = [Routes0, Routes1];");
    expect(source).toContain("export const AppLayer =");
    expect(source).toContain("export const ServerLayer =");
    expect(source).toContain("export const handler =");
    expect(source).toContain("export default handler");
    expect(source).toContain("export function run");
    expect(source).toContain("Layer.launch(layer)");
    expect(source).toContain("Ids.Default");
    expect(source).toContain("Effect.tapCause");
    expect(source).toContain("type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;");
    expect(source).toContain("type ServerLayerInputs = readonly LayerOrGroup[];");
    expect(source).toContain(
      "type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;",
    );
    expect(source).toContain("function withErrorHandling<A, E, R>");
    expect(source).not.toContain("Effect.Effect<void, any");
    expect(source).not.toContain("Cause.Cause<any>");
    expect(source).toContain("options.layers");
    expect(source).toContain("options.onError");
    expect(source).toContain("readonly host?: string;");
    expect(source).toContain("readonly port?: number;");
    expect(source).not.toContain("options.run");
    expect(source).not.toContain("readonly run?");
    expect(source).not.toContain("Effect.Effect<never, unknown");
    expect(source).not.toContain("Effect.Effect<unknown, unknown");
    expect(source).toContain("const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);");
    expect(source).toContain("host: runtimeConfig.host");
    expect(source).toContain("port: runtimeConfig.port");
    expect(source).toContain("function makeServerLayer(options: ServerListenConfig = {})");
    expect(source).toContain("const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);");
    expect(source).toContain("const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;");
    expect(source).toContain("function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig");
    expect(source).toContain("function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig");
    expect(source).toContain("TypedHttpServer.toNodeHandler(AppLayer)");
    expect(source).toContain("function isMainModule(meta: ImportMeta): boolean");
    expect(source).toContain("Effect.runFork(Effect.provide(run(), Context.empty()))");
    expect(source).not.toContain("export async function run");
  });

  it("preserves source order for repeated api and routes parameters", () => {
    const source = buildServer("typed:server?routes=./routes&api=./api1&api=./api2") as string;

    expect(source.indexOf('import Routes0 from "typed:router?dir=./routes";')).toBeLessThan(
      source.indexOf('import * as Api0 from "typed:api?dir=./api1";'),
    );
    expect(source).not.toContain("route-handlers:");
    expect(source.indexOf('import * as Api0 from "typed:api?dir=./api1";')).toBeLessThan(
      source.indexOf('import * as Api1 from "typed:api?dir=./api2";'),
    );
  });

  it("emits a default html and client pairing", () => {
    const source = buildServer(
      "typed:server?routes=./routes&html=./index.html&client=./client.ts",
    ) as string;

    expect(source).toContain('import * as Html0 from "typed:html?path=./index.html";');
    expect(source).toContain('client: "./client.ts"');
    expect(source).toContain('name: "default"');
    expect(source).toContain("ssrForHttp(routeModules[0], documentOptions(0))");
    expect(source).toContain("function renderPageHtml(pageIndex: number, url: string | URL, markup: string)");
  });

  it("emits repeated MPA page pairings", () => {
    const source = buildServer(
      "typed:server?routes=./routes&page=home:./home.html:./home.ts&page=admin:./admin.html:./admin.ts",
    ) as string;

    expect(source).toContain('import * as Html0 from "typed:html?path=./home.html";');
    expect(source).toContain('import * as Html1 from "typed:html?path=./admin.html";');
    expect(source).toContain('name: "home"');
    expect(source).toContain('client: "./admin.ts"');
  });

  it("imports entry-adjacent named server companions when present", () => {
    const fixture = createFixture({
      "src/.server.dependencies.ts": "export const layers = [];",
      "src/.html.ts": "export const pages = [];",
      "src/.errors.ts": "export const onError = () => undefined;",
    });
    const source = buildServer("typed:server?routes=./routes", fixture.importer) as string;

    expect(source).toContain('import * as ServerDependenciesCompanion from "./.server.dependencies.js";');
    expect(source).toContain('import * as ServerHtmlCompanion from "./.html.js";');
    expect(source).toContain('import * as ServerErrorsCompanion from "./.errors.js";');
    expect(source).toContain("const companionLayers = ServerDependenciesCompanion.layers;");
    expect(source).toContain("ServerHtmlCompanion.pages");
    expect(source).toContain("ServerErrorsCompanion.onError");
    expect(source).not.toContain("const companionLayers: ServerLayerInputs = ServerDependenciesCompanion.layers ?? [];");
    expect(source).not.toContain("_server");
  });

  it("type-checks generated server entry source", () => {
    const fixture = createFixture({
      "src/api.ts": 'import * as Layer from "effect/Layer";\nexport const ApiLayer = Layer.empty;\n',
      "src/routes.ts": "const routes: any = {};\nexport default routes;\n",
      "src/typed-config.ts": 'export const build = { outDir: "dist", clientOutDir: "public/client" };\n',
      "src/typed-app.d.ts": [
        'declare module "@typed/app/runtime" {',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Layer<never, unknown, unknown>;",
        "  export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];",
        "  export type ComputeLayers<Layers extends ReadonlyArray<LayerOrGroup>, Base extends LayerAny> = Base;",
        "  export function composeWithLayers<Base extends LayerAny, const Layers extends ReadonlyArray<LayerOrGroup>>(base: Base, layers?: Layers): ComputeLayers<Layers, Base>;",
        "  export const Ids: { readonly Default: Layer.Layer<never, never, never> };",
        "}",
        'declare module "@typed/app/TypedHttpServer" {',
        '  import type * as HttpServer from "effect/unstable/http/HttpServer";',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Layer<never, unknown, unknown>;",
        "  export const TypedHttpServer: {",
        "    readonly staticAssets: (options: { readonly projectRoot: string; readonly clientOutDir?: string; readonly dev: boolean }) => Layer.Layer<never, never, never>;",
        "    readonly layer: (options: { readonly projectRoot: string; readonly dev: boolean; readonly host?: string; readonly port?: number }) => Layer.Layer<HttpServer.HttpServer, never, never>;",
        "    readonly toNodeHandler: (layer: LayerAny) => unknown;",
        "  };",
        "}",
      ].join("\n"),
      "src/typed-ui.d.ts": [
        'declare module "@typed/ui" {',
        '  import type * as Effect from "effect/Effect";',
        "  export const ssrForHttp: (input: unknown, options?: { readonly renderDocument?: (input: { readonly markup: string; readonly url: string }) => Effect.Effect<string, never, never> }) => (router: unknown) => Effect.Effect<void, never, never>;",
        "}",
      ].join("\n"),
      "src/typed-template.d.ts": [
        'declare module "@typed/template" {',
        '  import type * as Effect from "effect/Effect";',
        "  export const StaticHtmlRenderTemplate: never;",
        "  export function renderToHtmlString(input: unknown): Effect.Effect<string, never, never>;",
        "}",
      ].join("\n"),
    });
    const source = buildServer("typed:server?api=./api&routes=./routes", fixture.importer) as string;
    const result = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/generated.server.ts",
      sourceText: source,
      rootFiles: [
        fixture.importer,
        join(fixture.root, "src/api.ts"),
        join(fixture.root, "src/routes.ts"),
        join(fixture.root, "src/typed-config.ts"),
        join(fixture.root, "src/typed-app.d.ts"),
        join(fixture.root, "src/typed-ui.d.ts"),
        join(fixture.root, "src/typed-template.d.ts"),
      ],
      moduleFallbacks: {
        "typed:api?dir=./api": join(fixture.root, "src/api.ts"),
        "typed:router?dir=./routes": join(fixture.root, "src/routes.ts"),
        "typed:config": join(fixture.root, "src/typed-config.ts"),
        "@typed/app/runtime": join(fixture.root, "src/typed-app.d.ts"),
        "@typed/app/TypedHttpServer": join(fixture.root, "src/typed-app.d.ts"),
        "@typed/template": join(fixture.root, "src/typed-template.d.ts"),
      },
    });

    expect(result.diagnostics).toEqual([]);
  });

  it("returns parser diagnostics with the server plugin name", () => {
    const result = buildServer(
      "typed:server?routes=./routes&html=./index.html&page=home:./home.html:./home.ts",
    ) as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-SERVER-005",
        message: "typed:server cannot combine page pairings with top-level html or client options",
        pluginName: "typed-server-virtual-module",
      },
    ]);
  });
});
