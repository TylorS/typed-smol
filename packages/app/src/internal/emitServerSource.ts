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
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import * as HttpRouter from "effect/unstable/http/HttpRouter";',
    'import { composeWithLayers, TypedHttpServer, type LayerOrGroup } from "@typed/app";',
    'import type { Matcher } from "@typed/router";',
    'import { ssrForHttp } from "@typed/ui";',
    'import * as TypedConfigModule from "typed:config";',
    ...emitImports(imports),
    ...emitHtmlImports(pages),
    ...emitCompanionImports(input.companions ?? []),
    emitConstants(imports, pages),
    emitExports(input.companions ?? []),
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
  return imports.map((entry) => {
    const moduleId = entry.kind === "api" ? `api:${entry.target}` : `router:${entry.target}`;
    const binding = entry.kind === "api" ? `Api${entry.index}` : `Routes${entry.index}`;
    if (entry.kind === "routes") return `import ${binding} from ${JSON.stringify(moduleId)};`;
    return `import * as ${binding} from ${JSON.stringify(moduleId)};`;
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
    `const apiModules = [${imports.filter((i) => i.kind === "api").map((i) => `Api${i.index}`).join(", ")}];`,
    `const routeModules: readonly RouteModule[] = [${imports.filter((i) => i.kind === "routes").map((i) => `Routes${i.index}`).join(", ")}];`,
    `const pageEntries = [${pages.map(pageEntrySource).join(", ")}];`,
    `const apiLayers = [${imports.filter((i) => i.kind === "api").map((i) => `Api${i.index}.ApiLayer`).join(", ")}];`,
    `const routeLayers = [${imports.filter((i) => i.kind === "routes").map((i) => `HttpRouter.use(ssrForHttp(Routes${i.index}))`).join(", ")}];`,
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
  const companionLayers = dependenciesCompanion
    ? `${dependenciesCompanion.binding}.layers ?? []`
    : "[]";
  const companionLayersDeclaration = dependenciesCompanion
    ? `const companionLayers: readonly LayerOrGroup[] = ${companionLayers};`
    : "const companionLayers: readonly [] = [];";
  const composedServerLayers = dependenciesCompanion
    ? "options.layers ?? []"
    : "options.layers ?? []";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    "type TypedBuildConfig = { readonly outDir?: string; readonly clientOutDir?: string };",
    "type TypedConfigExports = Partial<{ readonly build: TypedBuildConfig }>;",
    "type RuntimeErrorHandler = <E>(cause: Cause.Cause<E>) => Effect.Effect<void, never, never> | void;",
    "type RouteModule = Matcher.Any;",
    "type ServerRunOptions<Layers extends readonly LayerOrGroup[] = []> = {",
    "  readonly layers?: Layers;",
    "  readonly onError?: RuntimeErrorHandler;",
    "};",
    `const companionPages = ${companionPages};`,
    companionLayersDeclaration,
    `const companionOnError = ${companionOnError};`,
    "const typedConfig: TypedConfigExports = TypedConfigModule;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    "const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? \"dist\", \"client\");",
    "const dev = (import.meta as ImportMeta & { readonly env?: { readonly DEV?: boolean } }).env?.DEV === true;",
    "const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: process.cwd(), clientOutDir, dev });",
    "const appLayerBase = Layer.mergeAll(Layer.empty, ...apiLayers, ...routeLayers, staticAssetsLayer);",
    "export const AppLayer = composeWithLayers(appLayerBase, companionLayers);",
    "export const ServerLayer = HttpRouter.serve(AppLayer).pipe(",
    "  Layer.provide(TypedHttpServer.layer({ projectRoot: process.cwd(), dev })),",
    ");",
    "export const handler = TypedHttpServer.toNodeHandler(AppLayer);",
    "export default handler;",
    "export function run<const Layers extends readonly LayerOrGroup[] = []>(options: ServerRunOptions<Layers> = {}) {",
    `  const layer = composeWithLayers(ServerLayer, ${composedServerLayers});`,
    "  return withErrorHandling(Layer.launch(layer), options.onError);",
    "}",
    "function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError?: RuntimeErrorHandler): Effect.Effect<A, E, R> {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler<E>(handler: RuntimeErrorHandler, cause: Cause.Cause<E>) {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
    "function joinBuildPath(...parts: readonly string[]): string {",
    "  return parts.flatMap((part) => part.split(\"/\")).filter(Boolean).join(\"/\");",
    "}",
  ].join("\n");
}
