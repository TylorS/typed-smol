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
    'import { composeWithLayers, mount as mountRuntime, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";',
    'import * as TypedRouter from "@typed/router";',
    ...emitRouteImports(input.parsed.routes),
    ...emitCompanionImports(input.companions ?? []),
    emitTypes(),
    emitRuntime(input.parsed, input.companions ?? []),
  ].join("\n");
}

function emitTypes(): string {
  return [
    "type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;",
    "type BrowserLayerInputs = readonly LayerOrGroup[];",
    "type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;",
    "type BrowserCompanionLayers = typeof companionLayers;",
    "type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];",
    "type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;",
    "type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;",
    "type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;",
    "type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;",
    "interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {",
    "  readonly window?: Window;",
    "  readonly root?: string | HTMLElement;",
    "  readonly layers?: Layers;",
    "  readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;",
    "}",
    "type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };",
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import Routes${index} from "typed:router?dir=${toRouterTarget(target)}";`;
  });
}

function toRouterTarget(target: string): string {
  return target;
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
  const companionLayers = dependenciesCompanion ? `${dependenciesCompanion.binding}.layers` : "[]";
  const companionLayersDeclaration = dependenciesCompanion
    ? `const companionLayers = ${companionLayers};`
    : "const companionLayers = [] as const;";
  const companionOnError = errorsCompanion
    ? `${errorsCompanion.binding}.onError ?? undefined`
    : "undefined";
  return [
    `const routeModules = [${parsed.routes.map((_, index) => `Routes${index}`).join(", ")}];`,
    companionLayersDeclaration,
    `const companionOnError = ${companionOnError};`,
    `export const Routes = ${routeExpression(parsed.routes)};`,
    "export const BrowserRuntime = {",
    "  routeModules,",
    `  root: ${JSON.stringify(parsed.root)},`,
    `  base: ${JSON.stringify(parsed.base)},`,
    ...(parsed.mode === undefined ? [] : [`  mode: ${JSON.stringify(parsed.mode)},`]),
    `  name: ${JSON.stringify(parsed.name)},`,
    "  companionLayers,",
    "};",
    "function makeRenderLayer(win: Window, root: HTMLElement) {",
    "  return Layer.effectDiscard(mountRuntime(Routes, { root })).pipe(",
    "    Layer.provideMerge(TypedRouter.BrowserRouter(win)),",
    "  );",
    "}",
    "export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;",
    "export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;",
    "export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {",
    "  return hydrateFromOptions(options);",
    "}",
    "function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {",
    "  const win = options.window ?? window;",
    "  const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);",
    "  const renderLayer = makeRenderLayer(win, root);",
    dependenciesCompanion
      ? "  return composeWithLayers(renderLayer, [...companionLayers, ...(options.layers ?? [])] as BrowserAllLayers<BrowserLayerInputs>);"
      : "  return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);",
    "}",
    "export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;",
    "export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;",
    "export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {",
    "  const BrowserLayer = hydrateFromOptions(options);",
    "  const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);",
    "  return program;",
    "}",
    "function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {",
    '  if (typeof root !== "string") return root;',
    "  const element = document.querySelector(root);",
    "  if (element instanceof HTMLElement) return element;",
    "  throw new Error(`typed:browser root not found: ${root}`);",
    "}",
    "function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
  ].join("\n");
}

function routeExpression(routes: readonly string[]): string {
  if (routes.length === 1) return "Routes0";

  return `TypedRouter.merge(${routes.map((_, index) => `Routes${index}`).join(", ")})`;
}
