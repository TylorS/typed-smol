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

    expect(source).toContain('import * as Cause from "effect/Cause";');
    expect(source).toContain('import * as Effect from "effect/Effect";');
    expect(source).toContain('import * as Layer from "effect/Layer";');
    expect(source).toContain('import * as HttpRouter from "effect/unstable/http/HttpRouter";');
    expect(source).toContain('import * as TypedApp from "@typed/app";');
    expect(source).toContain('import * as TypedRouter from "@typed/router";');
    expect(source).toContain('import { ssrForHttp } from "@typed/ui";');
    expect(source).toContain('import * as Api0 from "api:./api";');
    expect(source).toContain('import Routes0 from "router:./routes1";');
    expect(source).toContain('import Routes1 from "router:./routes2";');
    expect(source).toContain("export const AppLayer =");
    expect(source).toContain("export const ServerLayer =");
    expect(source).toContain("export const handler =");
    expect(source).toContain("export default handler");
    expect(source).toContain("export function run");
    expect(source).toContain("Layer.launch(layer)");
    expect(source).toContain("Effect.tapCause");
    expect(source).toContain("function withErrorHandling(program, onError)");
    expect(source).not.toContain("import type");
    expect(source).toContain("options.layers");
    expect(source).toContain("options.onError");
    expect(source).not.toContain("options.run");
    expect(source).not.toContain("readonly run?");
    expect(source).not.toContain("Effect.Effect<never, unknown");
    expect(source).not.toContain("Effect.Effect<unknown, unknown");
    expect(source).toContain("TypedApp.TypedHttpServer.toNodeHandler(AppLayer)");
    expect(source).not.toContain("export async function run");
  });

  it("preserves source order for repeated api and routes parameters", () => {
    const source = buildServer("typed:server?routes=./routes&api=./api1&api=./api2") as string;

    expect(source.indexOf('import Routes0 from "router:./routes";')).toBeLessThan(
      source.indexOf('import * as Api0 from "api:./api1";'),
    );
    expect(source.indexOf('import * as Api0 from "api:./api1";')).toBeLessThan(
      source.indexOf('import * as Api1 from "api:./api2";'),
    );
  });

  it("emits a default html and client pairing", () => {
    const source = buildServer(
      "typed:server?routes=./routes&html=./index.html&client=./client.ts",
    ) as string;

    expect(source).toContain('import * as Html0 from "typed:html?path=./index.html";');
    expect(source).toContain('client: "./client.ts"');
    expect(source).toContain('name: "default"');
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
      "src/.dependencies.ts": "export const layers = [];",
      "src/.html.ts": "export const pages = [];",
      "src/.errors.ts": "export const onError = () => undefined;",
    });
    const source = buildServer("typed:server?routes=./routes", fixture.importer) as string;

    expect(source).toContain('import * as ServerDependenciesCompanion from "./.dependencies";');
    expect(source).toContain('import * as ServerHtmlCompanion from "./.html";');
    expect(source).toContain('import * as ServerErrorsCompanion from "./.errors";');
    expect(source).toContain("ServerDependenciesCompanion.layers");
    expect(source).toContain("ServerHtmlCompanion.pages");
    expect(source).toContain("ServerErrorsCompanion.onError");
    expect(source).not.toContain("_server");
  });

  it("type-checks generated server entry source", () => {
    const fixture = createFixture({
      "src/api.ts": 'import * as Layer from "effect/Layer";\nexport const ApiLayer = Layer.empty;\n',
      "src/routes.ts": "const routes: any = {};\nexport default routes;\n",
      "src/typed-config.ts": 'export const build = { outDir: "dist", clientOutDir: "public/client" };\n',
      "src/typed-app.d.ts": [
        'declare module "@typed/app" {',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Layer<never, any, any>;",
        "  export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];",
        "  export function composeWithLayers<Base extends LayerAny, const Layers extends ReadonlyArray<LayerOrGroup>>(base: Base, layers: Layers): LayerAny;",
        "  export const TypedHttpServer: {",
        "    readonly staticAssets: (options: { readonly projectRoot: string; readonly clientOutDir?: string; readonly dev: boolean }) => Layer.Layer<never, never, never>;",
        "    readonly layer: (options: { readonly projectRoot: string; readonly dev: boolean }) => Layer.Layer<never, never, never>;",
        "    readonly toNodeHandler: (layer: LayerAny) => unknown;",
        "  };",
        "}",
      ].join("\n"),
      "src/typed-ui.d.ts":
        'declare module "@typed/ui" { export const ssrForHttp: (input: any) => (router: any) => any; }\n',
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
      generatedPath: "src/generated.server.js",
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
        "api:./api": join(fixture.root, "src/api.ts"),
        "router:./routes": join(fixture.root, "src/routes.ts"),
        "typed:config": join(fixture.root, "src/typed-config.ts"),
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
