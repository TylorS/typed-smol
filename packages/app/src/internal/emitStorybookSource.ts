import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";

type StorybookId = Extract<TypedVirtualModuleId, { readonly kind: "storybook" }>;
type RuntimeId = Extract<StorybookId, { readonly module: "runtime" }>;

export function emitStorybookSource(parsed: StorybookId): string {
  switch (parsed.module) {
    case "preview":
      return 'export { default, projectAnnotations, renderToCanvas } from "@typed/storybook/preview.js";\n';
    case "testing":
      return [
        'export { composeStories, composeStory, setProjectAnnotations } from "@typed/storybook/testing";',
        'export { default as projectAnnotations } from "@typed/storybook/preview.js";',
        "",
      ].join("\n");
    case "runtime":
      return emitRuntime(parsed);
  }
}

function emitRuntime(parsed: RuntimeId): string {
  return [
    'import * as Layer from "effect/Layer";',
    'import type { LayerOrGroup } from "@typed/app/runtime";',
    'import { defineTypedStoryRuntime } from "@typed/storybook";',
    'import * as TypedRouter from "@typed/router";',
    ...emitRouteImports(parsed.routes),
    ...emitApiImports(parsed.apis),
    emitRuntimeBody(parsed),
  ].join("\n");
}

function emitRouteImports(routes: readonly string[]): readonly string[] {
  return routes.map((target, index) => {
    return `import Routes${index} from "typed:router?dir=${target}";`;
  });
}

function emitApiImports(apis: readonly string[]): readonly string[] {
  return apis.map((target, index) => {
    return `import * as Api${index} from "typed:api?dir=${target}";`;
  });
}

function emitRuntimeBody(parsed: RuntimeId): string {
  const routeModules = parsed.routes.map((_, index) => `Routes${index}`);
  const apiModules = parsed.apis.map((_, index) => `Api${index}`);
  const apiLayers = apiModules.map((binding) => `${binding}.ApiLayer`);
  const apiDependencies = apiModules.map((binding) => `${binding}.DependenciesLayer`);
  const generatedLayers = [...apiDependencies, ...apiLayers];
  return [
    `export const routeModules = [${routeModules.join(", ")}] as const;`,
    `export const apiModules = [${apiModules.join(", ")}] as const;`,
    `export const apiLayers = [${apiLayers.join(", ")}] as const;`,
    `export const Routes = ${routeExpression(routeModules)};`,
    `export const DependenciesLayer = ${layerExpression(apiDependencies)};`,
    `const generatedLayers = [${generatedLayers.join(", ")}] as const;`,
    "interface StoryRuntimeOptions<Layers extends readonly LayerOrGroup[] = readonly [], TestLayers extends readonly LayerOrGroup[] = readonly []> {",
    "  readonly layers?: Layers;",
    "  readonly testLayers?: TestLayers;",
    "}",
    "export function makeStoryRuntime<const Layers extends readonly LayerOrGroup[] = readonly [], const TestLayers extends readonly LayerOrGroup[] = readonly []>(",
    "  options: StoryRuntimeOptions<Layers, TestLayers> = {},",
    ") {",
    "  return defineTypedStoryRuntime({",
    `    path: ${JSON.stringify(parsed.path)},`,
    `    routes: ${JSON.stringify(parsed.routes)},`,
    `    api: ${JSON.stringify(parsed.apis)},`,
    "    ...options,",
    "    layers: [...generatedLayers, ...(options.layers ?? [])] as const,",
    "  });",
    "}",
    "export const parameters = { typed: makeStoryRuntime() };",
    "",
  ].join("\n");
}

function routeExpression(routeModules: readonly string[]): string {
  if (routeModules.length === 0) return "undefined";
  if (routeModules.length === 1) return routeModules[0];
  return `TypedRouter.merge(${routeModules.join(", ")})`;
}

function layerExpression(layers: readonly string[]): string {
  if (layers.length === 0) return "Layer.empty";
  if (layers.length === 1) return layers[0];
  return `Layer.mergeAll(${layers.join(", ")})`;
}
