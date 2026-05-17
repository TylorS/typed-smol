import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { BrowserCompanionImport } from "./browserCompanions.js";

export interface EmitBrowserSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>;
  readonly companions?: readonly BrowserCompanionImport[];
}

export function emitBrowserSource(input: EmitBrowserSourceInput): string {
  return [
    'import * as Cause from "effect/Cause";',
    'import * as Context from "effect/Context";',
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    'import { Fx } from "@typed/fx";',
    'import { BrowserRouter, merge, type Matcher } from "@typed/router";',
    'import { DomRenderTemplate, render } from "@typed/template";',
    ...emitRouteImports(input.parsed.routes),
    ...emitCompanionImports(input.companions ?? []),
    emitRuntime(input.parsed, input.companions ?? []),
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import Routes${index} from "router:${toRouterTarget(target)}";`;
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
  const companionLayersDeclaration = dependenciesCompanion
    ? `const companionLayers: readonly LayerOrGroup[] = ${companionLayers};`
    : "const companionLayers: readonly [] = [];";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    "type RuntimeErrorHandler = <E>(cause: Cause.Cause<E>) => Effect.Effect<unknown, never, never> | void;",
    "type RouteModule = Matcher.Any;",
    "type BrowserRunOptions<Layers extends readonly LayerOrGroup[] = []> = {",
    "  readonly layers?: Layers;",
    "  readonly onError?: RuntimeErrorHandler;",
    "  readonly root?: string | HTMLElement;",
    "  readonly window?: Window;",
    "  readonly run?: (program: BrowserProgram<Layers>) => Effect.Effect<unknown, never, never>;",
    "};",
    "type BrowserLayerFor<Layers extends readonly LayerOrGroup[]> = ComputeLayers<Layers, ReturnType<typeof makeRenderLayer>>;",
    "type BrowserProgram<Layers extends readonly LayerOrGroup[]> = Effect.Effect<never, Layer.Error<BrowserLayerFor<Layers>>, Layer.Services<BrowserLayerFor<Layers>>>;",
    `const routeModules: readonly RouteModule[] = [${parsed.routes.map((_, index) => `Routes${index}`).join(", ")}];`,
    companionLayersDeclaration,
    `const companionOnError = ${companionOnError};`,
    `export const Routes = ${routeExpression(parsed.routes)};`,
    "export const BrowserRuntime = {",
    "  routeModules,",
    `  root: ${JSON.stringify(parsed.root)},`,
    `  base: ${JSON.stringify(parsed.base)},`,
    `  mode: ${JSON.stringify(parsed.mode)},`,
    `  name: ${JSON.stringify(parsed.name)},`,
    "  companionLayers,",
    "};",
    "function makeRenderLayer(win: Window, root: HTMLElement) {",
    "  return Fx.drainLayer(render(Routes, root)).pipe(",
    "    Layer.provideMerge(BrowserRouter(win)),",
    "    Layer.provideMerge(DomRenderTemplate.using(win.document)),",
    "  );",
    "}",
    "export function hydrate(options?: BrowserRunOptions<readonly []> & { readonly layers?: undefined }): BrowserLayerFor<readonly []>;",
    "export function hydrate<const Layers extends readonly LayerOrGroup[]>(options: BrowserRunOptions<Layers> & { readonly layers: Layers }): BrowserLayerFor<Layers>;",
    "export function hydrate(options: BrowserRunOptions<readonly LayerOrGroup[]>): BrowserLayerFor<readonly LayerOrGroup[]>;",
    "export function hydrate(options: BrowserRunOptions<readonly LayerOrGroup[]> = {}) {",
    "  const win = options.window ?? window;",
    "  const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);",
    "  const renderLayer = makeRenderLayer(win, root);",
    dependenciesCompanion
      ? "  return composeWithLayers(renderLayer, [...companionLayers, ...(options.layers ?? [])]);"
      : "  return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);",
    "}",
    "export function run(options?: BrowserRunOptions<readonly []> & { readonly layers?: undefined }): BrowserProgram<readonly []>;",
    "export function run<const Layers extends readonly LayerOrGroup[]>(options: BrowserRunOptions<Layers> & { readonly layers: Layers }): BrowserProgram<Layers>;",
    "export function run(options: BrowserRunOptions<readonly LayerOrGroup[]> = {}) {",
    "  const BrowserLayer = hydrate(options);",
    "  const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);",
    "  const runnable = Effect.provide(program, Context.empty());",
    "  return options.run ? options.run(runnable) : runnable;",
    "}",
    "function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {",
    "  if (typeof root !== \"string\") return root;",
    "  const element = document.querySelector(root);",
    "  if (element instanceof HTMLElement) return element;",
    "  throw new Error(`typed:browser root not found: ${root}`);",
    "}",
    "function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError?: RuntimeErrorHandler): Effect.Effect<A, E, R> {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler<E>(handler: RuntimeErrorHandler, cause: Cause.Cause<E>) {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
  ].join("\n");
}

function routeExpression(routes: readonly string[]): string {
  if (routes.length === 1) return "Routes0";

  return `merge(${routes.map((_, index) => `Routes${index}`).join(", ")})`;
}
