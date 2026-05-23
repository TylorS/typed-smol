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
    return `import * as Api${index} from "typed:api?dir=${target}&mode=client";`;
  });
}

function emitRuntimeBody(parsed: RuntimeId): string {
  const routeModules = parsed.routes.map((_, index) => `Routes${index}`);
  const apiModules = parsed.apis.map((_, index) => `Api${index}`);
  return [
    `export const routeModules = [${routeModules.join(", ")}] as const;`,
    `export const apiModules = [${apiModules.join(", ")}] as const;`,
    "export const apiLayers = [] as const;",
    `export const serverOrigin = ${jsonOrUndefined(parsed.serverOrigin)};`,
    `export const proxyPath = ${jsonOrDefault(parsed.proxyPath, "/__typed_storybook_api")};`,
    "export const apiBaseUrl = serverOrigin === undefined ? proxyPath : new URL(proxyPath, serverOrigin).href;",
    `export const Routes = ${routeExpression(routeModules)};`,
    "export const DependenciesLayer = Layer.empty;",
    "const generatedLayers = [] as const;",
    "interface StoryRuntimeOptions {",
    "  readonly layers?: readonly LayerOrGroup[];",
    "  readonly testLayers?: readonly LayerOrGroup[];",
    "}",
    "export function makeStoryRuntime<const Options extends StoryRuntimeOptions = {}>(",
    "  options: Options = {} as Options,",
    ") {",
    "  return defineTypedStoryRuntime({",
    `    path: ${JSON.stringify(parsed.path)},`,
    `    routes: ${JSON.stringify(parsed.routes)},`,
    `    api: ${JSON.stringify(parsed.apis)},`,
    `    serverOrigin: ${jsonOrUndefined(parsed.serverOrigin)},`,
    `    proxyPath: ${jsonOrUndefined(parsed.proxyPath)},`,
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

function jsonOrUndefined(value: string | undefined): string {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

function jsonOrDefault(value: string | undefined, fallback: string): string {
  return JSON.stringify(value ?? fallback);
}
