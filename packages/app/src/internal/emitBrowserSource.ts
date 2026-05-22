import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { BrowserCompanionImport } from "./browserCompanions.js";

export interface EmitBrowserSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>;
  readonly companions?: readonly BrowserCompanionImport[];
}

export function emitBrowserSource(input: EmitBrowserSourceInput): string {
  return [
    'import * as Cause from "effect/Cause";',
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import { composeWithLayers, hydrate as hydrateRuntime, mount as mountRuntime, type LayerOrGroup } from "@typed/app";',
    'import { BrowserRouter, merge, type Matcher } from "@typed/router";',
    ...emitRouteImports(input.parsed.routes),
    ...emitCompanionImports(input.companions ?? []),
    emitRuntime(input.parsed, input.companions ?? []),
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import * as Routes${index} from "router:${toRouterTarget(target)}";`;
  });
}

function toRouterTarget(target: string): string {
  return target === "*" ? "./routes" : target;
}

function emitCompanionImports(companions: readonly BrowserCompanionImport[]): readonly string[] {
  return companions.map((companion) => {
    return `import * as ${companion.binding} from ${JSON.stringify(companion.importPath)};`;
  });
}

function emitRuntime(
  parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>,
  companions: readonly BrowserCompanionImport[],
): string {
  const dependenciesCompanion = companions.find((companion) => companion.name === "dependencies");
  const errorsCompanion = companions.find((companion) => companion.name === "errors");
  const companionLayers = dependenciesCompanion
    ? `${dependenciesCompanion.binding}.layers ?? []`
    : "[]";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    "type RuntimeErrorHandler = (cause: Cause.Cause<unknown>) => Effect.Effect<unknown, never, never> | void;",
    "type RouteModule = { readonly default?: Matcher.Any; readonly router?: Matcher.Any };",
    "type BrowserRunOptions<Layers extends readonly LayerOrGroup[] = []> = {",
    "  readonly layers?: Layers;",
    "  readonly onError?: RuntimeErrorHandler;",
    "  readonly root?: string | HTMLElement;",
    "  readonly window?: Window;",
    "  readonly run?: (program: Effect.Effect<never, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>;",
    "};",
    `const routeModules: readonly RouteModule[] = [${parsed.routes.map((_, index) => `Routes${index}`).join(", ")}];`,
    `const companionLayers: readonly LayerOrGroup[] = ${companionLayers};`,
    `const companionOnError = ${companionOnError};`,
    `export const Routes = merge(${parsed.routes.map((_, index) => `routeMatcher(Routes${index})`).join(", ")});`,
    "export const BrowserRuntime = {",
    "  routeModules,",
    `  root: ${JSON.stringify(parsed.root)},`,
    `  base: ${JSON.stringify(parsed.base)},`,
    `  mode: ${JSON.stringify(parsed.mode)},`,
    `  name: ${JSON.stringify(parsed.name)},`,
    "  companionLayers,",
    "};",
    "export function hydrate<const Layers extends readonly LayerOrGroup[] = []>(options: BrowserRunOptions<Layers> = {}) {",
    "  const win = options.window ?? window;",
    "  const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);",
    "  const renderRuntime = BrowserRuntime.mode === \"mount\" ? mountRuntime : hydrateRuntime;",
    "  const renderLayer = Layer.effectDiscard(renderRuntime(Routes, { root })).pipe(",
    "    Layer.provideMerge(BrowserRouter(win)),",
    "  );",
    "  return composeWithLayers(renderLayer, [...companionLayers, ...(options.layers ?? [])]);",
    "}",
    "function routeMatcher(module: RouteModule): Matcher.Any {",
    "  return module.default ?? module.router ?? merge();",
    "}",
    "export function run<const Layers extends readonly LayerOrGroup[] = []>(options: BrowserRunOptions<Layers> = {}) {",
    "  const BrowserLayer = hydrate(options);",
    "  const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);",
    "  return options.run ? options.run(program) : program;",
    "}",
    "function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {",
    "  if (typeof root !== \"string\") return root;",
    "  const element = document.querySelector(root);",
    "  if (element instanceof HTMLElement) return element;",
    "  throw new Error(`typed:browser root not found: ${root}`);",
    "}",
    "function withErrorHandling(program: Effect.Effect<never, unknown, unknown>, onError?: RuntimeErrorHandler) {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler(handler: RuntimeErrorHandler, cause: Cause.Cause<unknown>) {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
  ].join("\n");
}
