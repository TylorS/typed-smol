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
    "// @ts-nocheck",
    'import * as Cause from "effect/Cause";',
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import * as HttpRouter from "effect/unstable/http/HttpRouter";',
    'import * as RouteHandlers from "@typed/app/RouteHandlers";',
    'import { TypedHttpServer } from "@typed/app/TypedHttpServer";',
    'import { composeWithLayers } from "@typed/app/runtime";',
    'import * as TypedRouter from "@typed/router";',
    'import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";',
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
  return imports.flatMap((entry) => {
    const moduleId = entry.kind === "api" ? `api:${entry.target}` : `router:${entry.target}`;
    const binding = entry.kind === "api" ? `Api${entry.index}` : `Routes${entry.index}`;
    if (entry.kind === "routes") {
      return [
        `import ${binding} from ${JSON.stringify(moduleId)};`,
        `import RouteHandlers${entry.index} from ${JSON.stringify(`route-handlers:${entry.target}`)};`,
      ];
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
    `const apiModules = [${imports.filter((i) => i.kind === "api").map((i) => `Api${i.index}`).join(", ")}];`,
    `const routeModules = [${imports.filter((i) => i.kind === "routes").map((i) => `RouteHandlers.apply(Routes${i.index}, RouteHandlers${i.index})`).join(", ")}];`,
    "const primaryRoutes = routeModules[0];",
    `const pageEntries = [${pages.map(pageEntrySource).join(", ")}];`,
    `const apiLayers = [${imports.filter((i) => i.kind === "api").map((i) => `Api${i.index}.ApiLayer`).join(", ")}];`,
    `const routeLayers = [${imports.filter((i) => i.kind === "routes").map((_, index) => `HttpRouter.use(ssrForHttp(routeModules[${index}]))`).join(", ")}];`,
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
    ? `const companionLayers = ${companionLayers};`
    : "const companionLayers = [];";
  const composedServerLayers = dependenciesCompanion
    ? "options.layers ?? []"
    : "options.layers ?? []";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    `const companionPages = ${companionPages};`,
    companionLayersDeclaration,
    `const companionOnError = ${companionOnError};`,
    "const typedConfig = TypedConfigModule;",
    "const typedBuildConfig = typedConfig.build ?? {};",
    "const clientOutDir = typedBuildConfig.clientOutDir ?? joinBuildPath(typedBuildConfig.outDir ?? \"dist\", \"client\");",
    "const dev = import.meta.env?.DEV === true;",
    "const staticAssetsLayer = TypedHttpServer.staticAssets({ projectRoot: process.cwd(), clientOutDir, dev });",
    "const appLayerBase = Layer.mergeAll(Layer.empty, StaticHtmlRenderTemplate, ...apiLayers, ...routeLayers, staticAssetsLayer);",
    "export const AppLayer = composeWithLayers(appLayerBase, companionLayers);",
    "export const ServerLayer = HttpRouter.serve(AppLayer).pipe(",
    "  Layer.provide(TypedHttpServer.layer({ projectRoot: process.cwd(), dev })),",
    ");",
    "export const handler = TypedHttpServer.toNodeHandler(AppLayer);",
    "export default handler;",
    "export function renderUrl(input) {",
    "  if (primaryRoutes === undefined) throw new Error(\"typed:server renderUrl requires at least one routes option\");",
    "  return renderToHtmlString(primaryRoutes).pipe(",
    "    Effect.provide(TypedRouter.ServerRouter({ url: input })),",
    "    Effect.provide(StaticHtmlRenderTemplate),",
    "    Effect.scoped,",
    "  );",
    "}",
    "export function run(options = {}) {",
    `  const layer = composeWithLayers(ServerLayer, ${composedServerLayers});`,
    "  return withErrorHandling(Layer.launch(layer), options.onError);",
    "}",
    "function withErrorHandling(program, onError) {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler(handler, cause) {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
    "function joinBuildPath(...parts) {",
    "  return parts.flatMap((part) => part.split(\"/\")).filter(Boolean).join(\"/\");",
    "}",
  ].join("\n");
}
