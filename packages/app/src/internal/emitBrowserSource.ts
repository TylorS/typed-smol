import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";
import type { BrowserCompanionImport } from "./browserCompanions.js";

export interface EmitBrowserSourceInput {
  readonly parsed: Extract<TypedVirtualModuleId, { readonly kind: "browser" }>;
  readonly companions?: readonly BrowserCompanionImport[];
}

export function emitBrowserSource(input: EmitBrowserSourceInput): string {
  return [
    "// @ts-nocheck",
    'import * as Cause from "effect/Cause";',
    'import * as Context from "effect/Context";',
    'import * as Effect from "effect/Effect";',
    'import * as Layer from "effect/Layer";',
    'import * as TypedAppRuntime from "@typed/app/runtime";',
    'import { Fx } from "@typed/fx";',
    'import * as TypedRouter from "@typed/router";',
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
    ? `const companionLayers = ${companionLayers};`
    : "const companionLayers = [];";
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
    `  mode: ${JSON.stringify(parsed.mode)},`,
    `  name: ${JSON.stringify(parsed.name)},`,
    "  companionLayers,",
    "};",
    "function makeRenderLayer(win, root) {",
    "  return Fx.drainLayer(render(Routes, root)).pipe(",
    "    Layer.provideMerge(TypedRouter.BrowserRouter(win)),",
    "    Layer.provideMerge(DomRenderTemplate.using(win.document)),",
    "  );",
    "}",
    "export function hydrate(options = {}) {",
    "  const win = options.window ?? window;",
    "  const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);",
    "  const renderLayer = makeRenderLayer(win, root);",
    dependenciesCompanion
      ? "  return TypedAppRuntime.composeWithLayers(renderLayer, [...companionLayers, ...(options.layers ?? [])]);"
      : "  return options.layers === undefined ? renderLayer : TypedAppRuntime.composeWithLayers(renderLayer, options.layers);",
    "}",
    "export function run(options = {}) {",
    "  const BrowserLayer = hydrate(options);",
    "  const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);",
    "  return Effect.provide(program, Context.empty());",
    "}",
    "function resolveRoot(root, document) {",
    "  if (typeof root !== \"string\") return root;",
    "  const element = document.querySelector(root);",
    "  if (element instanceof HTMLElement) return element;",
    "  throw new Error(`typed:browser root not found: ${root}`);",
    "}",
    "function withErrorHandling(program, onError) {",
    "  const handler = onError ?? companionOnError;",
    "  return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;",
    "}",
    "function callErrorHandler(handler, cause) {",
    "  const result = handler(cause);",
    "  return Effect.isEffect(result) ? result : Effect.void;",
    "}",
  ].join("\n");
}

function routeExpression(routes: readonly string[]): string {
  if (routes.length === 1) return "Routes0";

  return `TypedRouter.merge(${routes.map((_, index) => `Routes${index}`).join(", ")})`;
}
