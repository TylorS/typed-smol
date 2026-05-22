import type { TypedServerPage, TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { ServerCompanionImport } from "./serverCompanions.js";

export interface EmitServerSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "server" }>;
  readonly id: string;
  readonly companions?: readonly ServerCompanionImport[];
}

type OrderedImport =
  | { readonly kind: "api"; readonly index: number; readonly target: string }
  | { readonly kind: "routes"; readonly index: number; readonly target: string };

export function emitServerSource(input: EmitServerSourceInput): string {
  const imports = createOrderedImports(input.id);
  const pages = createPageEntries(input.parsed);
  return [
    'import * as Cause from "effect/Cause";',
    'import * as Context from "effect/Context";',
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import * as HttpRouter from "effect/unstable/http/HttpRouter";',
    'import { pathToFileURL } from "node:url";',
    'import { TypedHttpServer } from "@typed/app/TypedHttpServer";',
    'import { composeWithLayers, Ids, renderServer, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    'import * as TypedRouter from "@typed/router";',
    'import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";',
    'import { ssrForHttp } from "@typed/ui";',
    'import * as TypedConfigModule from "typed:config";',
    ...emitImports(imports),
    ...emitHtmlImports(pages),
    ...emitCompanionImports(input.companions ?? []),
    emitTypes(),
    emitConstants(imports, pages),
    emitExports(input.companions ?? []),
  ].join("\n");
}

function emitTypes(): string {
  return [
    "type ServerLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;",
    "type ServerLayerInputs = readonly LayerOrGroup[];",
    "type ServerBaseLayer = typeof ServerLayer;",
    "type ServerLayerWith<Layers extends ServerLayerInputs> = ComputeLayers<Layers, typeof ServerLayer>;",
    "type ServerRunLayer<Layers extends ServerLayerInputs> = ServerBaseLayer | ServerLayerWith<Layers>;",
    "type ServerRunEffect<Layers extends ServerLayerInputs> = Effect.Effect<never, Layer.Error<ServerRunLayer<Layers>>, Layer.Services<ServerRunLayer<Layers>>>;",
    "type ServerErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;",
    "interface ServerRunOptions<Layers extends ServerLayerInputs = readonly []> {",
    "  readonly layers?: Layers;",
    "  readonly onError?: ServerErrorHandler<Layer.Error<ServerLayerWith<Layers>>>;",
    "  readonly host?: string;",
    "  readonly port?: number;",
    "}",
    "interface ServerListenConfig {",
    "  readonly host?: string;",
    "  readonly port?: number;",
    "}",
    "interface ServerBuildConfig {",
    "  readonly outDir?: string;",
    "  readonly clientOutDir?: string;",
    "}",
    "interface ServerPageEntry {",
    "  readonly name: string;",
    "  readonly html: {",
    "    readonly loadHtml: (options?: { readonly dev?: boolean; readonly url?: string }) => Promise<string>;",
    "    readonly renderHtml: (template: string, markup: string) => string;",
    "  };",
    "  readonly client: string;",
    "}",
    "type TypedConfigWithServerOptions = typeof TypedConfigModule & {",
    "  readonly build?: ServerBuildConfig;",
    "  readonly server?: ServerListenConfig;",
    "  readonly preview?: ServerListenConfig;",
    "};",
    "type ServerRunOptionsWithLayers<Layers extends ServerLayerInputs> = ServerRunOptions<Layers> & { readonly layers: Layers };",
  ].join("\n");
}

function createOrderedImports(id: string): OrderedImport[] {
  const query = id.slice(id.indexOf("?") + 1);
  const counts = { api: 0, routes: 0 };
  const imports: OrderedImport[] = [];
  for (const [key, target] of new URLSearchParams(query)) {
    if (key !== "api" && key !== "routes") continue;
    imports.push({ kind: key, index: counts[key]++, target });
  }
  return imports;
}

function createPageEntries(
  parsed: Extract<TypedVirtualModuleId, { readonly kind: "server" }>,
): readonly TypedServerPage[] {
  if (parsed.pages.length > 0) return parsed.pages;
  if (!parsed.html) return [];
  return [{ name: parsed.name ?? "default", html: parsed.html, client: parsed.client ?? "" }];
}

function emitImports(imports: readonly OrderedImport[]): readonly string[] {
  return imports.flatMap((entry) => {
    const moduleId =
      entry.kind === "api" ? `typed:api?dir=${entry.target}` : `typed:router?dir=${entry.target}`;
    const binding = entry.kind === "api" ? `Api${entry.index}` : `Routes${entry.index}`;
    if (entry.kind === "routes") {
      return [`import ${binding} from ${JSON.stringify(moduleId)};`];
    }
    return [`import * as ${binding} from ${JSON.stringify(moduleId)};`];
  });
}

function emitHtmlImports(pages: readonly TypedServerPage[]): readonly string[] {
  return pages.map((page, index) => {
    return `import * as Html${index} from "typed:html?path=${page.html}";`;
  });
}

function emitCompanionImports(companions: readonly ServerCompanionImport[]): readonly string[] {
  return companions.map((companion) => {
    return `import * as ${companion.binding} from ${JSON.stringify(companion.importPath)};`;
  });
}

function emitConstants(
  imports: readonly OrderedImport[],
  pages: readonly TypedServerPage[],
): string {
  return [
    `const apiModules = [${imports
      .filter((i) => i.kind === "api")
      .map((i) => `Api${i.index}`)
      .join(", ")}];`,
    `const routeModules = [${imports
      .filter((i) => i.kind === "routes")
      .map((i) => `Routes${i.index}`)
      .join(", ")}];`,
    "const primaryRoutes = routeModules[0];",
    `const pageEntries: readonly ServerPageEntry[] = [${pages.map(pageEntrySource).join(", ")}];`,
    `const apiLayers = [${imports
      .filter((i) => i.kind === "api")
      .map((i) => `Api${i.index}.ApiLayer`)
      .join(", ")}];`,
    `const routeLayers = [${imports
      .filter((i) => i.kind === "routes")
      .map(
        (_, index) =>
          `HttpRouter.use(ssrForHttp(routeModules[${index}], documentOptions(${index})))`,
      )
      .join(", ")}];`,
  ].join("\n");
}

function pageEntrySource(page: TypedServerPage, index: number): string {
  return [
    "{",
    ` name: ${JSON.stringify(page.name)},`,
    ` html: Html${index},`,
    ` client: ${JSON.stringify(page.client)},`,
    "}",
  ].join("");
}

function emitExports(companions: readonly ServerCompanionImport[]): string {
  const pagesCompanion = companions.find((companion) => companion.name === "html");
  const dependenciesCompanion = companions.find((companion) => companion.name === "dependencies");
  const errorsCompanion = companions.find((companion) => companion.name === "errors");
  const companionPages = pagesCompanion ? `${pagesCompanion.binding}.pages ?? []` : "[]";
  const companionLayers = dependenciesCompanion ? `${dependenciesCompanion.binding}.layers` : "[]";
  const companionLayersDeclaration = dependenciesCompanion
    ? `const companionLayers = ${companionLayers};`
    : "const companionLayers: readonly [] = [];";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    `const companionPages = ${companionPages};`,
    companionLayersDeclaration,
    `const companionOnError = ${companionOnError};`,
    "const typedConfig = TypedConfigModule as TypedConfigWithServerOptions;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    'const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? "dist", "client");',
    "const dev = (import.meta as { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;",
    "const typedRuntimeConfig = resolveRuntimeConfig(typedConfig, dev);",
    "const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: process.cwd(), clientOutDir, dev });",
    "const frameworkLayers = [StaticHtmlRenderTemplate, Ids.Default] as const;",
    "const appLayers = [...frameworkLayers, ...companionLayers] as const;",
    "const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);",
    "export const ServerRuntime = { apiModules, routeModules, pageEntries, renderServer };",
    "export const AppLayer = composeWithLayers(appLayerBase, appLayers);",
    "export const ServerLayer = makeServerLayer();",
    "export const handler = TypedHttpServer.toNodeHandler(AppLayer);",
    "export default handler;",
    "function makeServerLayer(options: ServerListenConfig = {}) {",
    "  const runtimeConfig = mergeListenConfig(typedRuntimeConfig, options);",
    "  return composeWithLayers(",
    "    HttpRouter.serve(appLayerBase).pipe(Layer.provide(TypedHttpServer.layer({",
    "    projectRoot: process.cwd(),",
    "    dev,",
    "    host: runtimeConfig.host,",
    "    port: runtimeConfig.port,",
    "    }))),",
    "    appLayers,",
    "  );",
    "}",
    "export function renderUrl(input: string | URL) {",
    '  if (primaryRoutes === undefined) throw new Error("typed:server renderUrl requires at least one routes option");',
    "  return renderToHtmlString(primaryRoutes).pipe(",
    "    Effect.provide(TypedRouter.ServerRouter({ url: input })),",
    "    Effect.provide(StaticHtmlRenderTemplate),",
    "    Effect.scoped,",
    "    Effect.flatMap((markup) => renderPageHtml(0, input, markup)),",
    "  );",
    "}",
    "function documentOptions(pageIndex: number) {",
    "  const page = pageEntries[pageIndex] ?? pageEntries[0];",
    "  return page === undefined ? {} : {",
    "    renderDocument: ({ markup, url }: { readonly markup: string; readonly url: string }) => renderPageHtml(pageIndex, url, markup),",
    "  };",
    "}",
    "function renderPageHtml(pageIndex: number, url: string | URL, markup: string) {",
    "  const page = pageEntries[pageIndex] ?? pageEntries[0];",
    "  if (page === undefined) return Effect.succeed(markup);",
    "  return Effect.promise(async () => {",
    "    const template = await page.html.loadHtml({ dev, url: String(url) });",
    "    return page.html.renderHtml(template, markup);",
    "  });",
    "}",
    "export function run(options?: ServerRunOptions<readonly []>): ServerRunEffect<readonly []>;",
    "export function run<const Layers extends ServerLayerInputs>(options: ServerRunOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<ServerLayerWith<Layers>>, Layer.Services<ServerLayerWith<Layers>>>;",
    "export function run(options: ServerRunOptions<readonly []> | ServerRunOptionsWithLayers<ServerLayerInputs> = {}): ServerRunEffect<ServerLayerInputs> {",
    "  const baseLayer = hasListenOverrides(options) ? makeServerLayer(options) : ServerLayer;",
    "  const layer = options.layers === undefined ? baseLayer : composeWithLayers(baseLayer, options.layers);",
    "  return withErrorHandling(Layer.launch(layer), options.onError);",
    "}",
    "function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: ServerErrorHandler<E> | undefined): Effect.Effect<A, E, R> {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler<E>(handler: ServerErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
    "function isMainModule(meta: ImportMeta): boolean {",
    "  const entry = process.argv[1];",
    '  return typeof entry === "string" && meta.url === pathToFileURL(entry).href;',
    "}",
    "function joinBuildPath(...parts: readonly string[]) {",
    '  return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");',
    "}",
    "function resolveRuntimeConfig(config: TypedConfigWithServerOptions, isDev: boolean): ServerListenConfig {",
    "  return isDev ? config.server ?? {} : config.preview ?? config.server ?? {};",
    "}",
    "function mergeListenConfig(base: ServerListenConfig, overrides: ServerListenConfig): ServerListenConfig {",
    "  return {",
    "    host: overrides.host ?? base.host,",
    "    port: overrides.port ?? base.port,",
    "  };",
    "}",
    "function hasListenOverrides(options: ServerListenConfig): boolean {",
    "  return options.host !== undefined || options.port !== undefined;",
    "}",
    "if (isMainModule(import.meta)) {",
    "  Effect.runFork(Effect.provide(run(), Context.empty()));",
    "}",
  ].join("\n");
}
