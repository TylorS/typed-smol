import { requestsAnyExport, requestsExport, type VirtualModuleBuildContext } from "@typed/virtual-modules";
import type { TypedVirtualModuleId } from "./frameworkVirtualModuleId.js";

type StorybookId = Extract<TypedVirtualModuleId, { readonly kind: "storybook" }>;
type RuntimeId = Extract<StorybookId, { readonly module: "runtime" }>;

export function emitStorybookSource(
  parsed: StorybookId,
  context?: VirtualModuleBuildContext,
): string {
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
      return emitRuntime(parsed, context);
  }
}

function emitRuntime(parsed: RuntimeId, context: VirtualModuleBuildContext | undefined): string {
  if (context && context.requestedExports.kind === "names") {
    return emitPrunedRuntime(parsed, context);
  }
  return [
    'import * as Layer from "effect/Layer";',
    ...(parsed.apis.length === 0
      ? ['import type * as HttpClient from "effect/unstable/http/HttpClient";']
      : []),
    'import type { LayerOrGroup } from "@typed/app/runtime";',
    'import { defineTypedStoryRuntime } from "@typed/storybook";',
    'import * as TypedRouter from "@typed/router";',
    ...emitRouteImports(parsed.routes),
    ...emitApiImports(parsed.apis),
    emitRuntimeBody(parsed),
  ].join("\n");
}

function emitPrunedRuntime(parsed: RuntimeId, context: VirtualModuleBuildContext): string {
  const plan = createRuntimeEmitPlan(context);
  const apiTargets = apiTargetsForPlan(parsed.apis, plan);
  return [
    ...emitRuntimeImports(parsed, plan, apiTargets),
    ...emitRouteImports(plan.needsRouteModules ? parsed.routes : []),
    ...emitApiImports(apiTargets),
    emitPrunedRuntimeBody(parsed, apiTargets, plan),
  ].join("\n");
}

interface RuntimeEmitPlan {
  readonly routeModules: boolean;
  readonly apiModules: boolean;
  readonly apiLayers: boolean;
  readonly makeClient: boolean;
  readonly makeClientWith: boolean;
  readonly serverOrigin: boolean;
  readonly proxyPath: boolean;
  readonly apiBaseUrl: boolean;
  readonly routes: boolean;
  readonly dependenciesLayer: boolean;
  readonly makeStoryRuntime: boolean;
  readonly parameters: boolean;
  readonly needsRouteModules: boolean;
  readonly needsAllApiModules: boolean;
  readonly needsPrimaryApiModule: boolean;
  readonly needsDependencyLayerValue: boolean;
}

function createRuntimeEmitPlan(context: VirtualModuleBuildContext): RuntimeEmitPlan {
  const makeStoryRuntime = needsStoryRuntime(context);
  const needsDependencyLayerValue = needsDependenciesLayer(context);
  const routeModules = requestsExport(context, "routeModules");
  const routes = requestsExport(context, "Routes");
  const apiModules = requestsExport(context, "apiModules");
  const apiLayers = requestsExport(context, "apiLayers");
  const makeClient = requestsExport(context, "makeClient");
  const makeClientWith = requestsExport(context, "makeClientWith");
  const parameters = requestsExport(context, "parameters");
  return {
    routeModules,
    apiModules,
    apiLayers,
    makeClient,
    makeClientWith,
    serverOrigin: requestsAnyExport(context, ["serverOrigin", "apiBaseUrl"]),
    proxyPath: requestsAnyExport(context, ["proxyPath", "apiBaseUrl"]),
    apiBaseUrl: requestsExport(context, "apiBaseUrl"),
    routes,
    dependenciesLayer: requestsExport(context, "DependenciesLayer"),
    makeStoryRuntime,
    parameters,
    needsRouteModules: routeModules || routes,
    needsAllApiModules: apiModules || apiLayers || needsDependencyLayerValue,
    needsPrimaryApiModule: makeClient || makeClientWith,
    needsDependencyLayerValue,
  };
}

function needsStoryRuntime(context: VirtualModuleBuildContext): boolean {
  return requestsAnyExport(context, ["makeStoryRuntime", "parameters"]);
}

function needsDependenciesLayer(context: VirtualModuleBuildContext): boolean {
  return requestsAnyExport(context, ["DependenciesLayer", "makeStoryRuntime", "parameters"]);
}

function apiTargetsForPlan(
  apis: readonly string[],
  plan: Pick<RuntimeEmitPlan, "needsAllApiModules" | "needsPrimaryApiModule">,
): readonly string[] {
  if (plan.needsAllApiModules) return apis;
  return plan.needsPrimaryApiModule ? apis.slice(0, 1) : [];
}

function emitRuntimeImports(
  parsed: RuntimeId,
  plan: RuntimeEmitPlan,
  apiTargets: readonly string[],
): readonly string[] {
  const needsLayer = plan.dependenciesLayer || (plan.needsDependencyLayerValue && apiTargets.length > 0);
  return [
    ...(plan.makeClientWith && parsed.apis.length === 0
      ? ['import type * as HttpClient from "effect/unstable/http/HttpClient";']
      : []),
    ...(needsLayer ? ['import * as Layer from "effect/Layer";'] : []),
    ...(plan.makeStoryRuntime
      ? [
          'import type { LayerOrGroup } from "@typed/app/runtime";',
          'import { defineTypedStoryRuntime } from "@typed/storybook";',
        ]
      : []),
    ...(plan.routes && parsed.routes.length > 1
      ? ['import * as TypedRouter from "@typed/router";']
      : []),
  ];
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
  const apiLayers = apiModules.map((module) => `${module}.DependenciesLayer`);
  return [
    `export const routeModules = [${routeModules.join(", ")}] as const;`,
    `export const apiModules = [${apiModules.join(", ")}] as const;`,
    `export const apiLayers = [${apiLayers.join(", ")}] as const;`,
    apiClientExports(apiModules),
    `export const serverOrigin = ${jsonOrUndefined(parsed.serverOrigin)};`,
    `export const proxyPath = ${jsonOrDefault(parsed.proxyPath, "/__typed_storybook_api")};`,
    "export const apiBaseUrl = serverOrigin === undefined ? proxyPath : new URL(proxyPath, serverOrigin).href;",
    `export const Routes = ${routeExpression(routeModules)};`,
    dependencyLayerExpression(apiLayers),
    generatedLayersExpression(apiLayers),
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

function emitPrunedRuntimeBody(
  parsed: RuntimeId,
  apiTargets: readonly string[],
  plan: RuntimeEmitPlan,
): string {
  const symbols = runtimeSymbols(parsed.routes, apiTargets);
  return [
    ...moduleExportLines(symbols, plan),
    prunedApiClientExports(symbols.apiModules, plan),
    ...runtimeConfigLines(parsed, plan),
    ...runtimeRouteAndLayerLines(symbols, plan),
    ...storyRuntimeLines(parsed, symbols, plan),
    "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

interface RuntimeSymbols {
  readonly routeModules: readonly string[];
  readonly apiModules: readonly string[];
  readonly apiLayers: readonly string[];
}

function runtimeSymbols(routes: readonly string[], apis: readonly string[]): RuntimeSymbols {
  const apiModules = apis.map((_, index) => `Api${index}`);
  return {
    routeModules: routes.map((_, index) => `Routes${index}`),
    apiModules,
    apiLayers: apiModules.map((module) => `${module}.DependenciesLayer`),
  };
}

function moduleExportLines(symbols: RuntimeSymbols, plan: RuntimeEmitPlan): readonly string[] {
  return [
    plan.routeModules ? `export const routeModules = [${symbols.routeModules.join(", ")}] as const;` : "",
    plan.apiModules ? `export const apiModules = [${symbols.apiModules.join(", ")}] as const;` : "",
    plan.apiLayers ? `export const apiLayers = [${symbols.apiLayers.join(", ")}] as const;` : "",
  ];
}

function runtimeConfigLines(parsed: RuntimeId, plan: RuntimeEmitPlan): readonly string[] {
  return [
    plan.serverOrigin ? `export const serverOrigin = ${jsonOrUndefined(parsed.serverOrigin)};` : "",
    plan.proxyPath ? `export const proxyPath = ${jsonOrDefault(parsed.proxyPath, "/__typed_storybook_api")};` : "",
    plan.apiBaseUrl
      ? "export const apiBaseUrl = serverOrigin === undefined ? proxyPath : new URL(proxyPath, serverOrigin).href;"
      : "",
  ];
}

function runtimeRouteAndLayerLines(symbols: RuntimeSymbols, plan: RuntimeEmitPlan): readonly string[] {
  return [
    plan.routes ? `export const Routes = ${routeExpression(symbols.routeModules)};` : "",
    plan.dependenciesLayer ? dependencyLayerExportExpression(symbols.apiLayers) : "",
  ];
}

function storyRuntimeLines(
  parsed: RuntimeId,
  symbols: RuntimeSymbols,
  plan: RuntimeEmitPlan,
): readonly string[] {
  return [
    plan.makeStoryRuntime
      ? generatedLayersExpressionForPrunedRuntime(symbols.apiLayers, plan.dependenciesLayer)
      : "",
    plan.makeStoryRuntime ? storyRuntimeSource(parsed) : "",
    plan.parameters ? "export const parameters = { typed: makeStoryRuntime() };" : "",
  ];
}

function prunedApiClientExports(
  apiModules: readonly string[],
  plan: Pick<RuntimeEmitPlan, "makeClient" | "makeClientWith">,
): string {
  if (!plan.makeClient && !plan.makeClientWith) return "";
  if (apiModules.length === 0) return noApiClientExports(plan);
  const primary = apiModules[0]!;
  return [
    plan.makeClient ? `export const makeClient = ${primary}.makeClient;` : "",
    plan.makeClientWith ? `export const makeClientWith = ${primary}.makeClientWith;` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function noApiClientExports(plan: Pick<RuntimeEmitPlan, "makeClient" | "makeClientWith">): string {
  return [
    plan.makeClient
      ? [
          "export const makeClient = (_options?: { readonly baseUrl?: URL | string }) => {",
          '  throw new Error("Storybook runtime has no api targets configured");',
          "};",
        ].join("\n")
      : "",
    plan.makeClientWith
      ? [
          "export const makeClientWith = <E, R>(",
          "  _httpClient: HttpClient.HttpClient.With<E, R>,",
          "  _options?: { readonly baseUrl?: URL | string },",
          ") => {",
          '  throw new Error("Storybook runtime has no api targets configured");',
          "};",
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function dependencyLayerExpression(apiLayers: readonly string[]): string {
  if (apiLayers.length === 0) return "export const DependenciesLayer = Layer.empty;";
  return "export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...apiLayers);";
}

function dependencyLayerExportExpression(apiLayers: readonly string[]): string {
  if (apiLayers.length === 0) return "export const DependenciesLayer = Layer.empty;";
  return `export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...[${apiLayers.join(", ")}]);`;
}

function generatedLayersExpression(apiLayers: readonly string[]): string {
  if (apiLayers.length === 0) return "const generatedLayers = [] as const;";
  return "const generatedLayers = [DependenciesLayer] as const;";
}

function generatedLayersExpressionForPrunedRuntime(
  apiLayers: readonly string[],
  hasDependenciesLayerExport: boolean,
): string {
  if (apiLayers.length === 0) return "const generatedLayers = [] as const;";
  const layerExpression = hasDependenciesLayerExport
    ? "DependenciesLayer"
    : `Layer.mergeAll(Layer.empty, ...[${apiLayers.join(", ")}])`;
  return `const generatedLayers = [${layerExpression}] as const;`;
}

function storyRuntimeSource(parsed: RuntimeId): string {
  return [
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

function apiClientExports(apiModules: readonly string[]): string {
  if (apiModules.length === 0) {
    return [
      "export const makeClient = (_options?: { readonly baseUrl?: URL | string }) => {",
      '  throw new Error("Storybook runtime has no api targets configured");',
      "};",
      "export const makeClientWith = <E, R>(",
      "  _httpClient: HttpClient.HttpClient.With<E, R>,",
      "  _options?: { readonly baseUrl?: URL | string },",
      ") => {",
      '  throw new Error("Storybook runtime has no api targets configured");',
      "};",
    ].join("\n");
  }
  const primary = apiModules[0]!;
  return [
    `export const makeClient = ${primary}.makeClient;`,
    `export const makeClientWith = ${primary}.makeClientWith;`,
  ].join("\n");
}
