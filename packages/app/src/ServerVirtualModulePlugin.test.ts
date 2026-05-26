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
  it("uses the nearest typed.config.ts root for generated server projectRoot", () => {
    const fixture = createFixture({ "typed.config.ts": "export default {};" });
    const result = buildServer("typed:server?routes=./routes", fixture.importer);

    expect(result).toContain(`projectRoot: ${JSON.stringify(fixture.root)}`);
    expect(result).not.toContain("projectRoot: process.cwd()");
  });

  it("serves the composed app layer for production preview", () => {
    const fixture = createFixture({
      "src/.server.dependencies.ts": "export const layers = [];",
    });
    const source = buildServer(
      "typed:server?api=./api&routes=./routes",
      fixture.importer,
    ) as string;

    expect(source).toContain("const appLayer = composeWithLayers(appLayerBase, appLayers);");
    expect(source).toContain(
      "HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({",
    );
    expect(source).not.toContain("HttpRouter.serve(appLayerBase)");
  });

  it("resolves valid typed:server ids", () => {
    const plugin = createServerVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:server?api=./api", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:server?name=app", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:browser?routes=*", "/project/src/entry.ts")).toBe(false);
  });

  it("emits composable run, handler, and ServerLayer exports for APIs and routes", () => {
    const source = buildServer(
      "typed:server?api=./api&routes=./routes1&routes=./routes2",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Context from "effect/Context";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import { pathToFileURL } from "node:url";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
      import { ssrForHttp } from "@typed/ui";
      import * as TypedConfigModule from "typed:config";
      import * as Api0 from "typed:api?dir=./api";
      import Routes0 from "typed:router?dir=./routes1";
      import Routes1 from "typed:router?dir=./routes2";
      type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type ServerLayerInputs = readonly LayerOrGroup[];
      type ServerBaseLayer = typeof ServerLayer;
      type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;
      type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;
      type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;
      type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {
        readonly layers?: Layers;
        readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerListenConfig {
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerBuildConfig {
        readonly outDir?: string;
        readonly clientOutDir?: string;
      }
      interface ServerPageEntry {
        readonly name: string;
        readonly html: {
          readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;
          readonly renderHtml: (template: string, markup: string) => string;
        };
        readonly client: string;
      }
      type TypedConfigWithServerOptions = typeof TypedConfigModule & {
        readonly build?: ServerBuildConfig;
        readonly server?: ServerListenConfig;
        readonly preview?: ServerListenConfig;
      };
      type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };
      const apiModules = [Api0];
      const routeModules = [Routes0, Routes1];
      const primaryRoutes = routeModules[0];
      const pageEntries: readonly ServerPageEntry[] = [];
      const apiLayers = [Api0.ApiLayer.pipe(Layer.provideMerge(Api0.DependenciesLayer), HttpRouter.provideRequest(Api0.DependenciesLayer))];
      const routeLayers = [HttpRouter.use(ssrForHttp(routeModules[0], documentOptions(0))), HttpRouter.use(ssrForHttp(routeModules[1], documentOptions(1)))];
      const companionPages = [];
      const companionLayers: readonly [] = [];
      const companionOnError = undefined;
      const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");
      const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;
      const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);
      const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app", clientOutDir, dev });
      const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;
      const appLayers = [...frameworkLayers, ...companionLayers] as const;
      const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);
      export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };
      export const AppLayer = composeWithLayers(appLayerBase, appLayers);
      export const ServerLayer = makeServerLayer();
      export const handler = TypedHttpServer.toNodeHandler(AppLayer);
      export default handler;
      function makeServerLayer(options: ServerListenConfig = {}) {
        const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);
        const appLayer = composeWithLayers(appLayerBase, appLayers);
        return HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({
          projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app",
          dev,
          host: runtimeConfig.host,
          port: runtimeConfig.port,
          })));
      }
      export function renderUrl(input: string | URL) {
        if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");
        return renderToHtmlString(primaryRoutes).pipe(
          Effect.provide(TypedRouter.ServerRouter({ url: input })),
          Effect.provide(StaticHtmlRenderTemplate),
          Effect.scoped,
          Effect.flatMap((markup) => renderPageHtml(0, input, markup)),
        );
      }
      function documentOptions(pageIndex: number) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        return page === undefined ? {} : {
          renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),
        };
      }
      function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        if (page === undefined) return Effect.succeed(markup);
        return Effect.promise(async () => {
          const template = await page.html.loadHtml({ dev, url: String(url) });
          return page.html.renderHtml(template, markup);
        });
      }
      export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;
      export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;
      export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {
        const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;
        const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);
        return withErrorHandling(Layer.launch(layer), options.onError);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }
      function isMainModule(meta: ImportMeta): boolean {
        const entry = process.argv[1];
        return typeof entry === "string" && meta.url === pathToFileURL(entry).href;
      }
      function joinBuildPath(...parts: readonly string[]) {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {
        return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};
      }
      function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {
        return {
          host: overrides.host ?? base.host,
          port: overrides.port ?? base.port,
        };
      }
      function hasListenOverrides(options: ServerListenConfig): boolean {
        return options.host !== undefined || options.port !== undefined;
      }
      if (isMainModule(import.meta)) {
        Effect.runFork(Effect.provide(run(), Context.empty()));
      }"
    `);
  });

  it("preserves source order for repeated api and routes parameters", () => {
    const source = buildServer("typed:server?routes=./routes&api=./api1&api=./api2") as string;

    expect(source.indexOf('import Routes0 from "typed:router?dir=./routes";')).toBeLessThan(
      source.indexOf('import * as Api0 from "typed:api?dir=./api1";'),
    );
    expect(source.indexOf('import * as Api0 from "typed:api?dir=./api1";')).toBeLessThan(
      source.indexOf('import * as Api1 from "typed:api?dir=./api2";'),
    );
    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Context from "effect/Context";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import { pathToFileURL } from "node:url";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
      import { ssrForHttp } from "@typed/ui";
      import * as TypedConfigModule from "typed:config";
      import Routes0 from "typed:router?dir=./routes";
      import * as Api0 from "typed:api?dir=./api1";
      import * as Api1 from "typed:api?dir=./api2";
      type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type ServerLayerInputs = readonly LayerOrGroup[];
      type ServerBaseLayer = typeof ServerLayer;
      type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;
      type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;
      type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;
      type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {
        readonly layers?: Layers;
        readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerListenConfig {
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerBuildConfig {
        readonly outDir?: string;
        readonly clientOutDir?: string;
      }
      interface ServerPageEntry {
        readonly name: string;
        readonly html: {
          readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;
          readonly renderHtml: (template: string, markup: string) => string;
        };
        readonly client: string;
      }
      type TypedConfigWithServerOptions = typeof TypedConfigModule & {
        readonly build?: ServerBuildConfig;
        readonly server?: ServerListenConfig;
        readonly preview?: ServerListenConfig;
      };
      type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };
      const apiModules = [Api0, Api1];
      const routeModules = [Routes0];
      const primaryRoutes = routeModules[0];
      const pageEntries: readonly ServerPageEntry[] = [];
      const apiLayers = [Api0.ApiLayer.pipe(Layer.provideMerge(Api0.DependenciesLayer), HttpRouter.provideRequest(Api0.DependenciesLayer)), Api1.ApiLayer.pipe(Layer.provideMerge(Api1.DependenciesLayer), HttpRouter.provideRequest(Api1.DependenciesLayer))];
      const routeLayers = [HttpRouter.use(ssrForHttp(routeModules[0], documentOptions(0)))];
      const companionPages = [];
      const companionLayers: readonly [] = [];
      const companionOnError = undefined;
      const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");
      const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;
      const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);
      const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app", clientOutDir, dev });
      const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;
      const appLayers = [...frameworkLayers, ...companionLayers] as const;
      const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);
      export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };
      export const AppLayer = composeWithLayers(appLayerBase, appLayers);
      export const ServerLayer = makeServerLayer();
      export const handler = TypedHttpServer.toNodeHandler(AppLayer);
      export default handler;
      function makeServerLayer(options: ServerListenConfig = {}) {
        const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);
        const appLayer = composeWithLayers(appLayerBase, appLayers);
        return HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({
          projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app",
          dev,
          host: runtimeConfig.host,
          port: runtimeConfig.port,
          })));
      }
      export function renderUrl(input: string | URL) {
        if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");
        return renderToHtmlString(primaryRoutes).pipe(
          Effect.provide(TypedRouter.ServerRouter({ url: input })),
          Effect.provide(StaticHtmlRenderTemplate),
          Effect.scoped,
          Effect.flatMap((markup) => renderPageHtml(0, input, markup)),
        );
      }
      function documentOptions(pageIndex: number) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        return page === undefined ? {} : {
          renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),
        };
      }
      function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        if (page === undefined) return Effect.succeed(markup);
        return Effect.promise(async () => {
          const template = await page.html.loadHtml({ dev, url: String(url) });
          return page.html.renderHtml(template, markup);
        });
      }
      export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;
      export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;
      export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {
        const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;
        const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);
        return withErrorHandling(Layer.launch(layer), options.onError);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }
      function isMainModule(meta: ImportMeta): boolean {
        const entry = process.argv[1];
        return typeof entry === "string" && meta.url === pathToFileURL(entry).href;
      }
      function joinBuildPath(...parts: readonly string[]) {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {
        return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};
      }
      function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {
        return {
          host: overrides.host ?? base.host,
          port: overrides.port ?? base.port,
        };
      }
      function hasListenOverrides(options: ServerListenConfig): boolean {
        return options.host !== undefined || options.port !== undefined;
      }
      if (isMainModule(import.meta)) {
        Effect.runFork(Effect.provide(run(), Context.empty()));
      }"
    `);
  });

  it("emits a default html and client pairing", () => {
    const source = buildServer(
      "typed:server?routes=./routes&html=./index.html&client=./client.ts",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Context from "effect/Context";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import { pathToFileURL } from "node:url";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
      import { ssrForHttp } from "@typed/ui";
      import * as TypedConfigModule from "typed:config";
      import Routes0 from "typed:router?dir=./routes";
      import * as Html0 from "typed:html?path=./index.html";
      type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type ServerLayerInputs = readonly LayerOrGroup[];
      type ServerBaseLayer = typeof ServerLayer;
      type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;
      type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;
      type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;
      type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {
        readonly layers?: Layers;
        readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerListenConfig {
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerBuildConfig {
        readonly outDir?: string;
        readonly clientOutDir?: string;
      }
      interface ServerPageEntry {
        readonly name: string;
        readonly html: {
          readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;
          readonly renderHtml: (template: string, markup: string) => string;
        };
        readonly client: string;
      }
      type TypedConfigWithServerOptions = typeof TypedConfigModule & {
        readonly build?: ServerBuildConfig;
        readonly server?: ServerListenConfig;
        readonly preview?: ServerListenConfig;
      };
      type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };
      const apiModules = [];
      const routeModules = [Routes0];
      const primaryRoutes = routeModules[0];
      const pageEntries: readonly ServerPageEntry[] = [{ name: "default", html: Html0, client: "./client.ts",}];
      const apiLayers = [];
      const routeLayers = [HttpRouter.use(ssrForHttp(routeModules[0], documentOptions(0)))];
      const companionPages = [];
      const companionLayers: readonly [] = [];
      const companionOnError = undefined;
      const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");
      const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;
      const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);
      const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app", clientOutDir, dev });
      const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;
      const appLayers = [...frameworkLayers, ...companionLayers] as const;
      const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);
      export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };
      export const AppLayer = composeWithLayers(appLayerBase, appLayers);
      export const ServerLayer = makeServerLayer();
      export const handler = TypedHttpServer.toNodeHandler(AppLayer);
      export default handler;
      function makeServerLayer(options: ServerListenConfig = {}) {
        const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);
        const appLayer = composeWithLayers(appLayerBase, appLayers);
        return HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({
          projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app",
          dev,
          host: runtimeConfig.host,
          port: runtimeConfig.port,
          })));
      }
      export function renderUrl(input: string | URL) {
        if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");
        return renderToHtmlString(primaryRoutes).pipe(
          Effect.provide(TypedRouter.ServerRouter({ url: input })),
          Effect.provide(StaticHtmlRenderTemplate),
          Effect.scoped,
          Effect.flatMap((markup) => renderPageHtml(0, input, markup)),
        );
      }
      function documentOptions(pageIndex: number) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        return page === undefined ? {} : {
          renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),
        };
      }
      function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        if (page === undefined) return Effect.succeed(markup);
        return Effect.promise(async () => {
          const template = await page.html.loadHtml({ dev, url: String(url) });
          return page.html.renderHtml(template, markup);
        });
      }
      export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;
      export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;
      export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {
        const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;
        const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);
        return withErrorHandling(Layer.launch(layer), options.onError);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }
      function isMainModule(meta: ImportMeta): boolean {
        const entry = process.argv[1];
        return typeof entry === "string" && meta.url === pathToFileURL(entry).href;
      }
      function joinBuildPath(...parts: readonly string[]) {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {
        return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};
      }
      function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {
        return {
          host: overrides.host ?? base.host,
          port: overrides.port ?? base.port,
        };
      }
      function hasListenOverrides(options: ServerListenConfig): boolean {
        return options.host !== undefined || options.port !== undefined;
      }
      if (isMainModule(import.meta)) {
        Effect.runFork(Effect.provide(run(), Context.empty()));
      }"
    `);
  });

  it("emits repeated MPA page pairings", () => {
    const source = buildServer(
      "typed:server?routes=./routes&page=home:./home.html:./home.ts&page=admin:./admin.html:./admin.ts",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Context from "effect/Context";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import { pathToFileURL } from "node:url";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
      import { ssrForHttp } from "@typed/ui";
      import * as TypedConfigModule from "typed:config";
      import Routes0 from "typed:router?dir=./routes";
      import * as Html0 from "typed:html?path=./home.html";
      import * as Html1 from "typed:html?path=./admin.html";
      type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type ServerLayerInputs = readonly LayerOrGroup[];
      type ServerBaseLayer = typeof ServerLayer;
      type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;
      type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;
      type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;
      type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {
        readonly layers?: Layers;
        readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerListenConfig {
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerBuildConfig {
        readonly outDir?: string;
        readonly clientOutDir?: string;
      }
      interface ServerPageEntry {
        readonly name: string;
        readonly html: {
          readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;
          readonly renderHtml: (template: string, markup: string) => string;
        };
        readonly client: string;
      }
      type TypedConfigWithServerOptions = typeof TypedConfigModule & {
        readonly build?: ServerBuildConfig;
        readonly server?: ServerListenConfig;
        readonly preview?: ServerListenConfig;
      };
      type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };
      const apiModules = [];
      const routeModules = [Routes0];
      const primaryRoutes = routeModules[0];
      const pageEntries: readonly ServerPageEntry[] = [{ name: "home", html: Html0, client: "./home.ts",}, { name: "admin", html: Html1, client: "./admin.ts",}];
      const apiLayers = [];
      const routeLayers = [HttpRouter.use(ssrForHttp(routeModules[0], documentOptions(0)))];
      const companionPages = [];
      const companionLayers: readonly [] = [];
      const companionOnError = undefined;
      const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");
      const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;
      const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);
      const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app", clientOutDir, dev });
      const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;
      const appLayers = [...frameworkLayers, ...companionLayers] as const;
      const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);
      export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };
      export const AppLayer = composeWithLayers(appLayerBase, appLayers);
      export const ServerLayer = makeServerLayer();
      export const handler = TypedHttpServer.toNodeHandler(AppLayer);
      export default handler;
      function makeServerLayer(options: ServerListenConfig = {}) {
        const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);
        const appLayer = composeWithLayers(appLayerBase, appLayers);
        return HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({
          projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app",
          dev,
          host: runtimeConfig.host,
          port: runtimeConfig.port,
          })));
      }
      export function renderUrl(input: string | URL) {
        if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");
        return renderToHtmlString(primaryRoutes).pipe(
          Effect.provide(TypedRouter.ServerRouter({ url: input })),
          Effect.provide(StaticHtmlRenderTemplate),
          Effect.scoped,
          Effect.flatMap((markup) => renderPageHtml(0, input, markup)),
        );
      }
      function documentOptions(pageIndex: number) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        return page === undefined ? {} : {
          renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),
        };
      }
      function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        if (page === undefined) return Effect.succeed(markup);
        return Effect.promise(async () => {
          const template = await page.html.loadHtml({ dev, url: String(url) });
          return page.html.renderHtml(template, markup);
        });
      }
      export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;
      export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;
      export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {
        const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;
        const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);
        return withErrorHandling(Layer.launch(layer), options.onError);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }
      function isMainModule(meta: ImportMeta): boolean {
        const entry = process.argv[1];
        return typeof entry === "string" && meta.url === pathToFileURL(entry).href;
      }
      function joinBuildPath(...parts: readonly string[]) {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {
        return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};
      }
      function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {
        return {
          host: overrides.host ?? base.host,
          port: overrides.port ?? base.port,
        };
      }
      function hasListenOverrides(options: ServerListenConfig): boolean {
        return options.host !== undefined || options.port !== undefined;
      }
      if (isMainModule(import.meta)) {
        Effect.runFork(Effect.provide(run(), Context.empty()));
      }"
    `);
  });

  it("imports entry-adjacent named server companions when present", () => {
    const fixture = createFixture({
      "src/.server.dependencies.ts": "export const layers = [];",
      "src/.html.ts": "export const pages = [];",
      "src/.errors.ts": "export const onError = () => undefined;",
    });
    const source = buildServer("typed:server?routes=./routes", fixture.importer) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Context from "effect/Context";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import * as HttpRouter from "effect/unstable/http/HttpRouter";
      import { pathToFileURL } from "node:url";
      import { TypedHttpServer } from "@typed/app/TypedHttpServer";
      import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
      import { ssrForHttp } from "@typed/ui";
      import * as TypedConfigModule from "typed:config";
      import Routes0 from "typed:router?dir=./routes";
      import * as ServerDependenciesCompanion from "./.server.dependencies.js";
      import * as ServerHtmlCompanion from "./.html.js";
      import * as ServerErrorsCompanion from "./.errors.js";
      type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type ServerLayerInputs = readonly LayerOrGroup[];
      type ServerBaseLayer = typeof ServerLayer;
      type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;
      type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;
      type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;
      type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {
        readonly layers?: Layers;
        readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerListenConfig {
        readonly host?: string;
        readonly port?: number;
      }
      interface ServerBuildConfig {
        readonly outDir?: string;
        readonly clientOutDir?: string;
      }
      interface ServerPageEntry {
        readonly name: string;
        readonly html: {
          readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;
          readonly renderHtml: (template: string, markup: string) => string;
        };
        readonly client: string;
      }
      type TypedConfigWithServerOptions = typeof TypedConfigModule & {
        readonly build?: ServerBuildConfig;
        readonly server?: ServerListenConfig;
        readonly preview?: ServerListenConfig;
      };
      type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };
      const apiModules = [];
      const routeModules = [Routes0];
      const primaryRoutes = routeModules[0];
      const pageEntries: readonly ServerPageEntry[] = [];
      const apiLayers = [];
      const routeLayers = [HttpRouter.use(ssrForHttp(routeModules[0], documentOptions(0)))];
      const companionPages = ServerHtmlCompanion.pages ?? [];
      const companionLayers = ServerDependenciesCompanion.layers;
      const companionOnError = ServerErrorsCompanion.onError ?? undefined;
      const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");
      const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;
      const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);
      const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app", clientOutDir, dev });
      const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;
      const appLayers = [...frameworkLayers, ...companionLayers] as const;
      const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);
      export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };
      export const AppLayer = composeWithLayers(appLayerBase, appLayers);
      export const ServerLayer = makeServerLayer();
      export const handler = TypedHttpServer.toNodeHandler(AppLayer);
      export default handler;
      function makeServerLayer(options: ServerListenConfig = {}) {
        const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);
        const appLayer = composeWithLayers(appLayerBase, appLayers);
        return HttpRouter.serve(appLayer).pipe(Layer.provide(TypedHttpServer.layer({
          projectRoot: "/Users/tylorsteinbergher/code/typed-smol/packages/app",
          dev,
          host: runtimeConfig.host,
          port: runtimeConfig.port,
          })));
      }
      export function renderUrl(input: string | URL) {
        if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");
        return renderToHtmlString(primaryRoutes).pipe(
          Effect.provide(TypedRouter.ServerRouter({ url: input })),
          Effect.provide(StaticHtmlRenderTemplate),
          Effect.scoped,
          Effect.flatMap((markup) => renderPageHtml(0, input, markup)),
        );
      }
      function documentOptions(pageIndex: number) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        return page === undefined ? {} : {
          renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),
        };
      }
      function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {
        const page = pageEntries[pageIndex] ?? pageEntries[0];
        if (page === undefined) return Effect.succeed(markup);
        return Effect.promise(async () => {
          const template = await page.html.loadHtml({ dev, url: String(url) });
          return page.html.renderHtml(template, markup);
        });
      }
      export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;
      export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;
      export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {
        const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;
        const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);
        return withErrorHandling(Layer.launch(layer), options.onError);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }
      function isMainModule(meta: ImportMeta): boolean {
        const entry = process.argv[1];
        return typeof entry === "string" && meta.url === pathToFileURL(entry).href;
      }
      function joinBuildPath(...parts: readonly string[]) {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {
        return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};
      }
      function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {
        return {
          host: overrides.host ?? base.host,
          port: overrides.port ?? base.port,
        };
      }
      function hasListenOverrides(options: ServerListenConfig): boolean {
        return options.host !== undefined || options.port !== undefined;
      }
      if (isMainModule(import.meta)) {
        Effect.runFork(Effect.provide(run(), Context.empty()));
      }"
    `);
  });

  it("type-checks generated server entry source", () => {
    const fixture = createFixture({
      "src/api.ts": [
        'import * as Context from "effect/Context";',
        'import * as Effect from "effect/Effect";',
        'import * as Layer from "effect/Layer";',
        'import type { Request } from "effect/unstable/http/HttpRouter";',
        'export class ApiDependency extends Context.Service<ApiDependency, { readonly ready: Effect.Effect<void> }>()("test/ApiDependency") {}',
        "export const DependenciesLayer = Layer.succeed(ApiDependency)({ ready: Effect.void });",
        'export const ApiLayer = Layer.effectDiscard(Effect.flatMap(ApiDependency, (dependency) => dependency.ready)) as Layer.Layer<never, never, ApiDependency | Request.From<"Requires", ApiDependency>>;',
      ].join("\n"),
      "src/routes.ts": "const routes: any = {};\nexport default routes;\n",
      "src/typed-config.ts":
        'export const build = { outDir: "dist", clientOutDir: "public/client" };\n',
      "src/typed-app.d.ts": [
        'declare module "@typed/app/runtime" {',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Layer<never, any, any>;",
        "  export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];",
        "  export type ComputeLayers<Layers extends ReadonlyArray<LayerOrGroup>, Base extends LayerAny> = readonly [] extends Layers ? Base : Layers extends readonly [infer Head extends LayerOrGroup, ...infer Tail extends ReadonlyArray<LayerOrGroup>] ? ComputeLayers<Tail, ProvideMerge<Base, ComputeLayer<Head>>> : Base;",
        "  export type ProvideMerge<A extends Layer.Any, B extends Layer.Any> = Layer.Layer<Layer.Success<A | B>, Layer.Error<A | B>, Exclude<Layer.Services<A>, Layer.Success<B>> | Layer.Services<B>>;",
        "  type ComputeLayer<L extends LayerOrGroup> = L extends ReadonlyArray<LayerAny> ? Layer.Layer<Layer.Success<L[number]>, Layer.Error<L[number]>, Layer.Services<L[number]>> : L extends LayerAny ? Layer.Layer<Layer.Success<L>, Layer.Error<L>, Layer.Services<L>> : never;",
        "  export function composeWithLayers<Base extends LayerAny, const Layers extends ReadonlyArray<LayerOrGroup>>(base: Base, layers?: Layers): ComputeLayers<Layers, Base>;",
        "  export const Ids: { readonly Default: Layer.Layer<never, never, never> };",
        "  export const renderServer: unknown;",
        "}",
        'declare module "@typed/app/TypedHttpServer" {',
        '  import type * as HttpServer from "effect/unstable/http/HttpServer";',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Any;",
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
    const source = buildServer(
      "typed:server?api=./api&routes=./routes",
      fixture.importer,
    ) as string;
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
