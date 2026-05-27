import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { analyzeTemplateModule, createComponentDevtoolsFact } from "@typed/compiler";
import type { ComponentSummary } from "@typed/devtools-protocol";
import type {
  ExportedTypeInfo,
  TypeInfoApi,
  TypeInfoFileSnapshot,
  VirtualModuleBuildError,
  VirtualModuleBuildContext,
  VirtualModuleBuildResult,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { mustEmitAllExports, requestsAnyExport, requestsExport } from "@typed/virtual-modules";
import {
  getCallableReturnType,
  classifyCatchForm,
  classifyDepsExport,
  isCallableNode,
  type DepsExportKind,
  typeNodeExpectsRefSubjectParam,
  typeNodeToRuntimeKind,
  type RuntimeKind,
  typeNodeIsEffectOptionReturn,
} from "./routeTypeNode.js";
import { catchExprFor, handlerExprFor, type RouterExpressionImports } from "./emitRouterHelpers.js";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  stripScriptExtension,
  toPosixPath,
} from "./path.js";
import { pathToIdentifier } from "./routeIdentifiers.js";

type ComposableKind =
  | "services"
  | "guard"
  | "layout"
  | "catch"
  | "headers"
  | "errors"
  | "middlewares"
  | "prefix"
  | "openapi"
  | "route-template"
  | "api-handler";

type ParsedComposableId =
  | {
      readonly ok: true;
      readonly kind: ComposableKind;
      readonly target: "dir" | "path";
      readonly value: string;
      readonly devtools?: true;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string };

const DIR_KINDS = new Set<ComposableKind>([
  "services",
  "guard",
  "layout",
  "catch",
  "headers",
  "errors",
  "middlewares",
  "prefix",
  "openapi",
]);
const PATH_KINDS = new Set<ComposableKind>(["route-template", "api-handler"]);
const SCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"]);
const API_HANDLER_EXPORTS = [
  "endpoint",
  "route",
  "method",
  "headers",
  "body",
  "success",
  "error",
  "metadata",
  "handler",
] as const;
const ROUTE_TEMPLATE_EXPORTS = [
  "route",
  "entrypoint",
  "template",
  "handler",
  "guard",
  "layout",
  "dependencies",
  "catcher",
  "__typedDevtoolsComponentSummaries",
] as const;

const DIR_FILE_BY_KIND: Partial<Record<ComposableKind, string>> = {
  services: "_dependencies.ts",
  guard: "_guard.ts",
  layout: "_layout.ts",
  catch: "_catch.ts",
  headers: "_headers.ts",
  errors: "_errors.ts",
  middlewares: "_middlewares.ts",
  prefix: "_prefix.ts",
  openapi: "_openapi.ts",
};

const SUFFIX_BY_KIND: Partial<Record<ComposableKind, string>> = {
  services: ".dependencies",
  guard: ".guard",
  layout: ".layout",
  catch: ".catch",
  middlewares: ".middlewares",
  prefix: ".prefix",
  openapi: ".openapi",
};

export function parseComposableTypedVirtualModuleId(id: string): ParsedComposableId {
  if (!id.startsWith("typed:")) {
    return { ok: false, code: "CVM-ID-001", reason: 'id must start with "typed:"' };
  }
  const body = id.slice("typed:".length);
  const queryIndex = body.indexOf("?");
  const kind = (queryIndex === -1 ? body : body.slice(0, queryIndex)) as ComposableKind;
  const params = new URLSearchParams(queryIndex === -1 ? "" : body.slice(queryIndex + 1));
  if (!DIR_KINDS.has(kind) && !PATH_KINDS.has(kind)) {
    return { ok: false, code: "CVM-ID-001", reason: `unsupported typed virtual module "${kind}"` };
  }
  const target = DIR_KINDS.has(kind) ? "dir" : "path";
  const allowedOptions = routeTemplateOptions(kind, target);
  const unsupported = [...params.keys()].find((key) => !allowedOptions.has(key));
  if (unsupported) {
    return {
      ok: false,
      code: "CVM-ID-QUERY-001",
      reason: `typed:${kind} does not support query option "${unsupported}"`,
    };
  }
  const devtools = routeTemplateDevtools(kind, params);
  if (!devtools.ok) return devtools;
  const values = params.getAll(target);
  if (values.length !== 1) {
    return {
      ok: false,
      code: "CVM-ID-TARGET-001",
      reason: `typed:${kind} requires exactly one "${target}" query option`,
    };
  }
  const value = normalizeRelativeTarget(values[0]!, `typed:${kind} ${target}`);
  if (!value.ok) return value;
  return {
    ok: true,
    kind,
    target,
    value: value.value,
    ...(devtools.value ? { devtools: true } : {}),
  };
}

function routeTemplateOptions(kind: ComposableKind, target: "dir" | "path"): ReadonlySet<string> {
  return kind === "route-template" ? new Set([target, "devtools"]) : new Set([target]);
}

function routeTemplateDevtools(
  kind: ComposableKind,
  params: URLSearchParams,
):
  | { readonly ok: true; readonly value: boolean }
  | { readonly ok: false; readonly code: string; readonly reason: string } {
  const values = kind === "route-template" ? params.getAll("devtools") : [];
  if (values.length === 0) return { ok: true, value: false };
  if (values.length === 1 && values[0] === "1") return { ok: true, value: true };
  return {
    ok: false,
    code: "CVM-ID-QUERY-002",
    reason: 'typed:route-template devtools must be "1" when present',
  };
}

export function createServicesVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("services");
}

export function createGuardVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("guard");
}

export function createLayoutVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("layout");
}

export function createCatchVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("catch");
}

export function createHeadersVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("headers");
}

export function createErrorsVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("errors");
}

export function createMiddlewaresVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("middlewares");
}

export function createPrefixVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("prefix");
}

export function createOpenApiVirtualModulePlugin(): VirtualModulePlugin {
  return createDirPlugin("openapi");
}

export function createRouteTemplateVirtualModulePlugin(): VirtualModulePlugin {
  return createPathPlugin("route-template");
}

export function createApiHandlerVirtualModulePlugin(): VirtualModulePlugin {
  return createPathPlugin("api-handler");
}

function createDirPlugin(
  kind: Extract<
    ComposableKind,
    | "services"
    | "guard"
    | "layout"
    | "catch"
    | "headers"
    | "errors"
    | "middlewares"
    | "prefix"
    | "openapi"
  >,
): VirtualModulePlugin {
  return {
    name: `typed-${kind}-virtual-module`,
    shouldResolve: (id, importer) => Boolean(importer) && matchesKind(id, kind),
    build(id, importer, api, context) {
      const resolved = resolveTarget(id, importer, context);
      if (!resolved.ok) return buildError(kind, resolved);
      if (resolved.target !== "dir") return buildError(kind, "expected dir target");
      if (!isExistingDirectory(resolved.path)) {
        return buildError(kind, `target directory does not exist: ${resolved.path}`);
      }
      return emitConcernDir(kind, resolved.path, importer, api, context);
    },
  };
}

function createPathPlugin(
  kind: Extract<ComposableKind, "route-template" | "api-handler">,
): VirtualModulePlugin {
  return {
    name: `typed-${kind}-virtual-module`,
    shouldResolve: (id, importer) => Boolean(importer) && matchesKind(id, kind),
    build(id, importer, api, context) {
      const resolved = resolveTarget(id, importer, context);
      if (!resolved.ok) return buildError(kind, resolved);
      if (resolved.target !== "path") return buildError(kind, "expected path target");
      if (!existsSync(resolved.path)) {
        return buildError(kind, `target file does not exist: ${resolved.path}`);
      }
      return kind === "api-handler"
        ? emitApiHandlerLeaf(resolved.path, importer, api, context)
        : emitRouteTemplateLeaf(resolved.path, importer, api, context, resolved.devtools === true);
    },
  };
}

function emitConcernDir(
  kind: ComposableKind,
  targetDir: string,
  importer: string,
  api: TypeInfoApi,
  context?: VirtualModuleBuildContext,
): VirtualModuleBuildResult {
  const paths = discoverConcernPaths(kind, targetDir);
  const importerDir = dirname(toPosixPath(importer));
  if (!context || context.requestedExports.kind === "all") {
    return emitFullConcernDir(kind, paths, targetDir, importerDir, api);
  }
  if (!requestsAnyExport(context, concernExportsFor(kind))) {
    return "export {};";
  }
  const partial = partialConcernSourcesFor(kind, paths, targetDir, api, context);
  if ("code" in partial) return buildError(kind, partial);
  if (partial.length === 0) return "export {};";
  const source = partial.join("\n");
  return emitVirtualModuleSource(
    [
      ...concernRuntimeImportsFor(kind, source, false),
      ...moduleImportsFor(kind, paths, importerDir, targetDir),
    ],
    source,
  );
}

function emitFullConcernDir(
  kind: ComposableKind,
  paths: readonly string[],
  targetDir: string,
  importerDir: string,
  api: TypeInfoApi,
): VirtualModuleBuildResult {
  const normalized = normalizedConcernFor(kind, paths, targetDir, api);
  if (typeof normalized !== "string") return buildError(kind, normalized);
  const source = `${modulesSourceFor(kind, paths)}${normalized}`;
  return emitVirtualModuleSource(
    [
      ...concernRuntimeImportsFor(kind, source, true),
      ...moduleImportsFor(kind, paths, importerDir, targetDir),
    ],
    source,
  );
}

function moduleImportsFor(
  kind: ComposableKind,
  paths: readonly string[],
  importerDir: string,
  targetDir: string,
): readonly string[] {
  return paths.map((path) => {
    const name = moduleNameFor(kind, path);
    return `import * as ${name} from ${JSON.stringify(toImportSpecifier(importerDir, targetDir, path))};`;
  });
}

function modulesSourceFor(kind: ComposableKind, paths: readonly string[]): string {
  const entries = paths
    .map((path) => `  ${JSON.stringify(path)}: ${moduleNameFor(kind, path)}`)
    .join(",\n");
  return `export const modules = {
${entries}
} as const;`;
}

function emitVirtualModuleSource(imports: readonly string[], source: string): string {
  return imports.length === 0 ? `${source}\n` : `${imports.join("\n")}\n\n${source}\n`;
}

function emitApiHandlerLeaf(
  path: string,
  importer: string,
  api: TypeInfoApi,
  context?: VirtualModuleBuildContext,
): VirtualModuleBuildResult {
  if (!mustEmitAllExports(context) && !requestsAnyExportDeclaration(context, API_HANDLER_EXPORTS)) {
    return "export {};";
  }
  const specifier = toImportSpecifier(
    dirname(toPosixPath(importer)),
    dirname(path),
    basename(path),
  );
  const snapshot = api.file(basename(path), { baseDir: dirname(path), watch: true });
  if (!snapshot.ok)
    return buildError("api-handler", `unable to read API endpoint type info: ${path}`);
  const mode = classifyApiHandlerMode(snapshot.snapshot, api);
  if (!mode.ok) return buildError("api-handler", mode);
  const optionalExports = ["headers", "body", "success", "error"].filter((name) =>
    snapshot.snapshot.exports.some((exp) => exp.name === name),
  );
  const options = mode.bodyMode === "payload" ? ', { body: "payload" }' : "";
  const handlerFactory = mode.raw ? "rawHandler" : "handler";
  const optionalLines = optionalExports
    .map((name) => `export const ${name} = Endpoint.${name};`)
    .join("\n");
  if (context && context.requestedExports.kind === "names") {
    return emitPartialApiHandlerLeaf(
      specifier,
      mode,
      optionalExports,
      options,
      handlerFactory,
      context,
    );
  }
  return `import * as Endpoint from ${JSON.stringify(specifier)};
import { ApiHandlers } from "@typed/app/httpapi/Handlers";

export const endpoint = Endpoint;
export const route = Endpoint.route;
export const method = Endpoint.method;
${optionalLines}
export const metadata = { bodyMode: ${JSON.stringify(mode.bodyMode)}, raw: ${mode.raw ? "true" : "false"} } as const;
export const handler = ApiHandlers.${handlerFactory}(Endpoint${options});
`;
}

function emitPartialApiHandlerLeaf(
  specifier: string,
  mode: Extract<ApiHandlerMode, { readonly ok: true }>,
  optionalExports: readonly string[],
  options: string,
  handlerFactory: "handler" | "rawHandler",
  context: VirtualModuleBuildContext,
): string {
  const imports = partialApiHandlerImports(specifier, optionalExports, context);
  const lines = partialApiHandlerLines(mode, optionalExports, options, handlerFactory, context);
  return lines.length === 0 ? "export {};" : emitVirtualModuleSource(imports, lines.join("\n"));
}

function partialApiHandlerImports(
  specifier: string,
  optionalExports: readonly string[],
  context: VirtualModuleBuildContext,
): readonly string[] {
  const endpointExports = ["endpoint", "route", "method", ...optionalExports];
  const needsEndpoint =
    requestsAnyExportDeclaration(context, endpointExports) ||
    requestsExportDeclaration(context, "handler");
  return [
    ...(needsEndpoint ? [`import * as Endpoint from ${JSON.stringify(specifier)};`] : []),
    ...(requestsExportDeclaration(context, "handler")
      ? ['import { ApiHandlers } from "@typed/app/httpapi/Handlers";']
      : []),
  ];
}

function partialApiHandlerLines(
  mode: Extract<ApiHandlerMode, { readonly ok: true }>,
  optionalExports: readonly string[],
  options: string,
  handlerFactory: "handler" | "rawHandler",
  context: VirtualModuleBuildContext,
): readonly string[] {
  const lines: string[] = [];
  if (requestsExportDeclaration(context, "endpoint")) {
    lines.push("export const endpoint = Endpoint;");
  }
  if (requestsExportDeclaration(context, "route")) {
    lines.push("export const route = Endpoint.route;");
  }
  if (requestsExportDeclaration(context, "method")) {
    lines.push("export const method = Endpoint.method;");
  }
  for (const name of optionalExports) {
    if (requestsExportDeclaration(context, name)) {
      lines.push(`export const ${name} = Endpoint.${name};`);
    }
  }
  if (requestsExportDeclaration(context, "metadata")) {
    lines.push(apiHandlerMetadataSource(mode));
  }
  if (requestsExportDeclaration(context, "handler")) {
    lines.push(`export const handler = ApiHandlers.${handlerFactory}(Endpoint${options});`);
  }
  return lines;
}

function apiHandlerMetadataSource(mode: Extract<ApiHandlerMode, { readonly ok: true }>): string {
  const raw = mode.raw ? "true" : "false";
  return `export const metadata = { bodyMode: ${JSON.stringify(mode.bodyMode)}, raw: ${raw} } as const;`;
}

type ApiHandlerMode =
  | { readonly ok: true; readonly bodyMode: "empty" | "payload"; readonly raw: boolean }
  | { readonly ok: false; readonly code: string; readonly reason: string };

function classifyApiHandlerMode(snapshot: TypeInfoFileSnapshot, api: TypeInfoApi): ApiHandlerMode {
  const handlerExport = snapshot.exports.find((exp) => exp.name === "handler");
  if (!handlerExport) {
    return {
      ok: false,
      code: "CVM-API-HANDLER-001",
      reason: `expected handler export in ${snapshot.filePath}`,
    };
  }
  const hasBodySchema = snapshot.exports.some((exp) => exp.name === "body");
  const acceptsBody = handlerAcceptsBodyParameter(handlerExport, api);
  const raw = api.isAssignableTo(handlerExport.type, "HttpServerResponse", [
    { kind: "returnType" },
    { kind: "typeArg", index: 0 },
  ]);

  return {
    ok: true,
    bodyMode: hasBodySchema && acceptsBody ? "payload" : "empty",
    raw,
  };
}

function handlerAcceptsBodyParameter(handlerExport: ExportedTypeInfo, api: TypeInfoApi): boolean {
  return (
    api.project(handlerExport.type, [
      { kind: "param", index: 0 },
      { kind: "property", name: "body" },
    ]) !== undefined
  );
}

function emitRouteTemplateLeaf(
  path: string,
  importer: string,
  api: TypeInfoApi,
  context?: VirtualModuleBuildContext,
  devtools = false,
): VirtualModuleBuildResult {
  if (
    !mustEmitAllExports(context) &&
    !requestsAnyExportDeclaration(context, ROUTE_TEMPLATE_EXPORTS)
  ) {
    return "export {};";
  }
  const specifier = toImportSpecifier(
    dirname(toPosixPath(importer)),
    dirname(path),
    basename(path),
  );
  const snapshot = api.file(basename(path), { baseDir: dirname(path), watch: true });
  if (!snapshot.ok) {
    return buildError("route-template", `unable to read route module type info: ${path}`);
  }
  const entrypoint = routeEntrypointFor(snapshot.snapshot, api);
  if (!entrypoint.ok) return buildError("route-template", entrypoint);
  const imports = createImportCollector();
  const emitDevtools = devtools || requestsRouteTemplateDevtoolsSummary(context);
  const devtoolsComponentSummaries = emitDevtools
    ? routeTemplateDevtoolsComponentSummaries(path, importer, entrypoint)
    : [];
  if (context && context.requestedExports.kind === "names") {
    return emitPartialRouteTemplateLeaf(
      snapshot.snapshot,
      specifier,
      entrypoint,
      imports,
      api,
      context,
      devtoolsComponentSummaries,
    );
  }
  const handler = handlerExprFor(
    entrypoint.runtimeKind,
    entrypoint.isFunction,
    entrypoint.expectsRefSubject,
    "RouteModule",
    entrypoint.exportName,
    imports.helpers,
  );
  const templateExport =
    entrypoint.exportName === "template" || entrypoint.exportName === "default"
      ? `export const template = RouteModule.${entrypoint.exportName};\n`
      : "";
  const localConcernExports = routeTemplateLocalConcernExports(
    snapshot.snapshot,
    "RouteModule",
    imports.helpers,
    api,
  );
  const optionalExports = [
    localConcernExports,
    devtools ? devtoolsComponentSummariesSource(devtoolsComponentSummaries) : "",
  ]
    .filter(Boolean)
    .join("\n");
  const optionalBlock = optionalExports.length > 0 ? `${optionalExports}\n` : "";
  return `${imports.lines()}import * as RouteModule from ${JSON.stringify(specifier)};

export const route = RouteModule.route;
export const entrypoint = ${JSON.stringify({
    exportName: entrypoint.exportName,
    runtimeKind: entrypoint.runtimeKind,
    isFunction: entrypoint.isFunction,
    expectsRefSubject: entrypoint.expectsRefSubject,
  })} as const;
${templateExport}export const handler = ${handler};
${optionalBlock}`;
}

function emitPartialRouteTemplateLeaf(
  snapshot: TypeInfoFileSnapshot,
  specifier: string,
  entrypoint: Extract<RouteEntrypoint, { readonly ok: true }>,
  imports: ReturnType<typeof createImportCollector>,
  api: TypeInfoApi,
  context: VirtualModuleBuildContext,
  devtoolsComponentSummaries: readonly ComponentSummary[],
): string {
  const lines = [
    ...partialRouteTemplateBaseLines(entrypoint, context),
    ...partialRouteTemplateHandlerLines(entrypoint, imports, context),
    ...partialRouteTemplateConcernLines(snapshot, imports.helpers, api, context),
    ...partialRouteTemplateDevtoolsLines(context, devtoolsComponentSummaries),
  ];
  if (lines.length === 0) return "export {};";
  return emitPartialRouteTemplateSource(specifier, imports, lines.join("\n"));
}

function partialRouteTemplateBaseLines(
  entrypoint: Extract<RouteEntrypoint, { readonly ok: true }>,
  context: VirtualModuleBuildContext,
): readonly string[] {
  const lines: string[] = [];
  if (requestsExportDeclaration(context, "route")) {
    lines.push("export const route = RouteModule.route;");
  }
  if (requestsExportDeclaration(context, "entrypoint")) {
    lines.push(
      `export const entrypoint = ${JSON.stringify({
        exportName: entrypoint.exportName,
        runtimeKind: entrypoint.runtimeKind,
        isFunction: entrypoint.isFunction,
        expectsRefSubject: entrypoint.expectsRefSubject,
      })} as const;`,
    );
  }
  if (
    requestsExportDeclaration(context, "template") &&
    (entrypoint.exportName === "template" || entrypoint.exportName === "default")
  ) {
    lines.push(`export const template = RouteModule.${entrypoint.exportName};`);
  }
  return lines;
}

function partialRouteTemplateHandlerLines(
  entrypoint: Extract<RouteEntrypoint, { readonly ok: true }>,
  imports: ReturnType<typeof createImportCollector>,
  context: VirtualModuleBuildContext,
): readonly string[] {
  if (requestsExportDeclaration(context, "handler")) {
    return [
      `export const handler = ${handlerExprFor(
        entrypoint.runtimeKind,
        entrypoint.isFunction,
        entrypoint.expectsRefSubject,
        "RouteModule",
        entrypoint.exportName,
        imports.helpers,
      )};`,
    ];
  }
  return [];
}

function partialRouteTemplateConcernLines(
  snapshot: TypeInfoFileSnapshot,
  imports: RouterExpressionImports,
  api: TypeInfoApi,
  context: VirtualModuleBuildContext,
): readonly string[] {
  const localConcernExports = routeTemplateLocalConcernExports(
    snapshot,
    "RouteModule",
    imports,
    api,
    context,
  );
  return localConcernExports.length > 0 ? [localConcernExports] : [];
}

function partialRouteTemplateDevtoolsLines(
  context: VirtualModuleBuildContext,
  summaries: readonly ComponentSummary[],
): readonly string[] {
  if (!requestsExportDeclaration(context, "__typedDevtoolsComponentSummaries")) return [];
  return [devtoolsComponentSummariesSource(summaries)];
}

function requestsRouteTemplateDevtoolsSummary(
  context: VirtualModuleBuildContext | undefined,
): boolean {
  return (
    context?.requestedExports.kind === "names" &&
    requestsExportDeclaration(context, "__typedDevtoolsComponentSummaries")
  );
}

function devtoolsComponentSummariesSource(summaries: readonly ComponentSummary[]): string {
  return `export const __typedDevtoolsComponentSummaries = ${JSON.stringify(summaries)} as const;`;
}

function routeTemplateDevtoolsComponentSummaries(
  path: string,
  importer: string,
  entrypoint: Extract<RouteEntrypoint, { readonly ok: true }>,
): readonly ComponentSummary[] {
  const moduleId = routeTemplateSourceModuleId(path, importer);
  const sourceText = readFileSync(path, "utf8");
  const analysis = analyzeTemplateModule({ moduleId, sourceText });
  const displayName = `${pathToIdentifier(basename(path))}Route`;

  return analysis.templates.map(
    (template, index) =>
      createComponentDevtoolsFact({
        displayName: index === 0 ? displayName : `${displayName}Template${index + 1}`,
        exportName: index === 0 ? entrypoint.exportName : `${entrypoint.exportName}:${index}`,
        moduleId,
        sourceText,
        template,
      }).summary,
  );
}

function routeTemplateSourceModuleId(path: string, importer: string): string {
  const rel = toPosixPath(relative(dirname(toPosixPath(importer)), toPosixPath(path)));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function emitPartialRouteTemplateSource(
  specifier: string,
  imports: ReturnType<typeof createImportCollector>,
  body: string,
): string {
  const routeModuleImport = body.includes("RouteModule.")
    ? `import * as RouteModule from ${JSON.stringify(specifier)};\n`
    : "";
  const header = `${imports.lines()}${routeModuleImport}`;
  return header.length === 0 ? `${body}\n` : `${header}\n${body}\n`;
}

function routeTemplateLocalConcernExports(
  snapshot: TypeInfoFileSnapshot,
  moduleName: string,
  imports: RouterExpressionImports,
  api: TypeInfoApi,
  context?: VirtualModuleBuildContext,
): string {
  const lines: string[] = [];
  if (
    requestsExportDeclaration(context, "guard") &&
    snapshot.exports.some((exp) => exp.name === "guard")
  ) {
    lines.push(`export const guard = ${moduleName}.guard;`);
  }
  if (
    requestsExportDeclaration(context, "layout") &&
    snapshot.exports.some((exp) => exp.name === "layout")
  ) {
    lines.push(`export const layout = ${moduleName}.layout;`);
  }
  if (
    requestsExportDeclaration(context, "dependencies") &&
    snapshot.exports.some((exp) => exp.name === "dependencies")
  ) {
    lines.push(`export const dependencies = ${moduleName}.dependencies;`);
  }
  const catchExport =
    snapshot.exports.find((exp) => exp.name === "catch") ??
    snapshot.exports.find((exp) => exp.name === "catchFn");
  if (requestsExportDeclaration(context, "catcher") && catchExport) {
    lines.push(
      `export const catcher = ${catchExprFor(
        classifyCatchForm(catchExport.type, api),
        moduleName,
        catchExport.name,
        imports,
      )};`,
    );
  }
  return lines.join("\n");
}

function requestsExportDeclaration(
  context: VirtualModuleBuildContext | undefined,
  exportName: string,
): boolean {
  if (!context || context.requestedExports.kind === "all") return true;
  return (
    context.requestedExports.names.has(exportName) ||
    context.requestedExports.typeOnlyNames.has(exportName)
  );
}

function requestsAnyExportDeclaration(
  context: VirtualModuleBuildContext | undefined,
  exportNames: readonly string[],
): boolean {
  if (!context || context.requestedExports.kind === "all") return true;
  return exportNames.some((exportName) => requestsExportDeclaration(context, exportName));
}

function discoverConcernPaths(kind: ComposableKind, targetDir: string): readonly string[] {
  const dirFile = DIR_FILE_BY_KIND[kind];
  const suffix = SUFFIX_BY_KIND[kind];
  return walk(targetDir)
    .map((path) => toPosixPath(relative(targetDir, path)))
    .filter((path) => SCRIPT_EXTENSIONS.has(extname(path).toLowerCase()))
    .filter((path) => isConcernPath(kind, path, dirFile, suffix))
    .sort();
}

function isConcernPath(
  kind: ComposableKind,
  path: string,
  dirFile: string | undefined,
  suffix: string | undefined,
): boolean {
  const fileName = basename(path);
  if (fileName === dirFile) return true;
  if (kind === "prefix" && fileName === "_api.ts") return true;
  return suffix ? stripScriptExtension(path).endsWith(suffix) : false;
}

function walk(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path));
    if (stat.isFile()) out.push(path);
  }
  return out;
}

type DependencyRef =
  | {
      readonly ok: true;
      readonly path: string;
      readonly exportName: "default" | "dependencies";
      readonly exportKind: DepsExportKind;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string };

function dependencyRefsFor(
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): readonly DependencyRef[] {
  return paths.map((path) => {
    const snapshot = api.file(path, { baseDir: targetDir, watch: true });
    if (!snapshot.ok) {
      return {
        ok: false,
        code: "CVM-SERVICES-001",
        reason: `unable to read dependency module type info: ${path}`,
      };
    }
    const ref = resolveExactlyOneExport(snapshot.snapshot, ["default", "dependencies"], path);
    if (!ref.ok) {
      return { ok: false, code: "CVM-SERVICES-001", reason: ref.reason };
    }
    const exportKind = classifyDepsExport(ref.exportInfo.type, api);
    if (exportKind === "unknown") {
      return {
        ok: false,
        code: "CVM-SERVICES-002",
        reason: `dependency export must be Layer, ServiceMap, or Array: ${path}`,
      };
    }
    return {
      ok: true,
      path,
      exportName: ref.exportName as "default" | "dependencies",
      exportKind,
    };
  });
}

type ExportRef =
  | {
      readonly ok: true;
      readonly path: string;
      readonly exportName: string;
      readonly exportInfo: ExportedTypeInfo;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string };

function normalizedConcernFor(
  kind: ComposableKind,
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): string | { readonly code: string; readonly reason: string } {
  switch (kind) {
    case "services":
      return normalizedServicesFor(paths, targetDir, api);
    case "guard":
    case "layout":
    case "catch":
    case "headers":
    case "errors":
    case "middlewares":
    case "prefix":
    case "openapi":
      return normalizedConcernMapFor(kind, paths, targetDir, api);
    case "route-template":
    case "api-handler":
      return "";
  }
}

type NormalizedConcernKind = Exclude<ComposableKind, "services" | "route-template" | "api-handler">;

function normalizedConcernMapFor(
  kind: NormalizedConcernKind,
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): string | { readonly code: string; readonly reason: string } {
  switch (kind) {
    case "guard":
      return normalizedExportMapFor(
        kind,
        "guards",
        paths,
        targetDir,
        api,
        ["guard", "default"],
        validateGuardRef,
      );
    case "layout":
      return normalizedExportMapFor(kind, "layouts", paths, targetDir, api, ["layout"]);
    case "catch":
      return normalizedCatchMapFor(paths, targetDir, api);
    case "headers":
      return normalizedExportMapFor(kind, "headers", paths, targetDir, api, ["headers"]);
    case "errors":
      return normalizedExportMapFor(kind, "errors", paths, targetDir, api, ["error"]);
    case "middlewares":
      return normalizedExportMapFor(kind, "middlewares", paths, targetDir, api, [
        "middleware",
        "default",
      ]);
    case "prefix":
      return normalizedExportMapFor(kind, "prefixes", paths, targetDir, api, ["prefix", "default"]);
    case "openapi":
      return normalizedExportMapFor(kind, "openapi", paths, targetDir, api, ["openapi", "default"]);
  }
}

function concernExportsFor(kind: ComposableKind): readonly string[] {
  switch (kind) {
    case "services":
      return [
        "modules",
        "dependencyInputs",
        "dependencyLayers",
        "dependencyLayerList",
        "DependenciesLayer",
      ];
    case "guard":
      return ["modules", "guards"];
    case "layout":
      return ["modules", "layouts"];
    case "catch":
      return ["modules", "catchers"];
    case "headers":
      return ["modules", "headers"];
    case "errors":
      return ["modules", "errors"];
    case "middlewares":
      return ["modules", "middlewares"];
    case "prefix":
      return ["modules", "prefixes"];
    case "openapi":
      return ["modules", "openapi"];
    case "route-template":
    case "api-handler":
      return [];
  }
}

function concernMapExportNameFor(kind: NormalizedConcernKind): string {
  switch (kind) {
    case "guard":
      return "guards";
    case "layout":
      return "layouts";
    case "catch":
      return "catchers";
    case "headers":
      return "headers";
    case "errors":
      return "errors";
    case "middlewares":
      return "middlewares";
    case "prefix":
      return "prefixes";
    case "openapi":
      return "openapi";
  }
}

function partialConcernSourcesFor(
  kind: ComposableKind,
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
  context: VirtualModuleBuildContext,
): readonly string[] | { readonly code: string; readonly reason: string } {
  const sources: string[] = [];
  if (requestsExport(context, "modules")) {
    sources.push(modulesSourceFor(kind, paths));
  }
  if (kind === "services") {
    return partialServicesSourcesFor(sources, paths, targetDir, api, context);
  }
  if (kind === "route-template" || kind === "api-handler") {
    return sources;
  }
  const exportName = concernMapExportNameFor(kind);
  if (!requestsExport(context, exportName)) return sources;
  const normalized = normalizedConcernMapFor(kind, paths, targetDir, api);
  if (typeof normalized !== "string") return normalized;
  sources.push(withoutLeadingLineBreak(normalized));
  return sources;
}

function withoutLeadingLineBreak(source: string): string {
  return source.startsWith("\n") ? source.slice(1) : source;
}

function normalizedServicesFor(
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): string | { readonly code: string; readonly reason: string } {
  const dependencyRefs = dependencyRefsFor(paths, targetDir, api);
  const failedDependency = dependencyRefs.find((ref) => !ref.ok);
  if (failedDependency && !failedDependency.ok) return failedDependency;
  const refs = dependencyRefs.filter((ref): ref is Extract<DependencyRef, { ok: true }> => ref.ok);
  if (refs.length === 0) {
    return `
export const dependencyInputs = {} as const;
export const dependencyLayers = {} as const;
export const DependenciesLayer = Layer.empty;`;
  }
  const inputEntries = refs
    .map(
      (ref) =>
        `  ${JSON.stringify(ref.path)}: ${moduleNameFor("services", ref.path)}.${ref.exportName}`,
    )
    .join(",\n");
  const layerEntries = refs
    .map((ref) => `  ${JSON.stringify(ref.path)}: ${dependencyLayerExprFor(ref)}`)
    .join(",\n");
  const layerListEntries = refs
    .map((ref) => `  dependencyLayers[${JSON.stringify(ref.path)}]`)
    .join(",\n");
  return `
export const dependencyInputs = {
${inputEntries}
} as const;
export const dependencyLayers = {
${layerEntries}
} as const;
export const dependencyLayerList = [
${layerListEntries}
] as const;
export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...dependencyLayerList);`;
}

type ValidDependencyRef = Extract<DependencyRef, { readonly ok: true }>;

function partialServicesSourcesFor(
  sources: readonly string[],
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
  context: VirtualModuleBuildContext,
): readonly string[] | { readonly code: string; readonly reason: string } {
  const needsServiceMap = requestsAnyExport(context, [
    "dependencyInputs",
    "dependencyLayers",
    "dependencyLayerList",
    "DependenciesLayer",
  ]);
  if (!needsServiceMap) return sources;
  const refs = validDependencyRefsFor(paths, targetDir, api);
  if ("code" in refs) return refs;
  const pruned = [...sources];
  if (requestsExport(context, "dependencyInputs")) {
    pruned.push(dependencyInputsSource(refs));
  }
  if (requestsExport(context, "dependencyLayers")) {
    pruned.push(dependencyLayersSource(refs));
  }
  if (requestsExport(context, "dependencyLayerList")) {
    pruned.push(dependencyLayerListSource(refs));
  }
  if (requestsExport(context, "DependenciesLayer")) {
    pruned.push(dependenciesLayerSource(refs));
  }
  return pruned;
}

function validDependencyRefsFor(
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): readonly ValidDependencyRef[] | { readonly code: string; readonly reason: string } {
  const dependencyRefs = dependencyRefsFor(paths, targetDir, api);
  const failedDependency = dependencyRefs.find((ref) => !ref.ok);
  if (failedDependency && !failedDependency.ok) return failedDependency;
  return dependencyRefs.filter((ref): ref is ValidDependencyRef => ref.ok);
}

function dependencyInputsSource(refs: readonly ValidDependencyRef[]): string {
  if (refs.length === 0) return "export const dependencyInputs = {} as const;";
  return `export const dependencyInputs = {
${dependencyInputEntries(refs)}
} as const;`;
}

function dependencyLayersSource(refs: readonly ValidDependencyRef[]): string {
  if (refs.length === 0) return "export const dependencyLayers = {} as const;";
  return `export const dependencyLayers = {
${dependencyLayerEntries(refs)}
} as const;`;
}

function dependencyLayerListSource(refs: readonly ValidDependencyRef[]): string {
  if (refs.length === 0) return "export const dependencyLayerList = [] as const;";
  return `export const dependencyLayerList = [
${dependencyLayerExpressionEntries(refs)}
] as const;`;
}

function dependenciesLayerSource(refs: readonly ValidDependencyRef[]): string {
  if (refs.length === 0) return "export const DependenciesLayer = Layer.empty;";
  return `export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...[
${dependencyLayerExpressionEntries(refs)}
] as const);`;
}

function dependencyInputEntries(refs: readonly ValidDependencyRef[]): string {
  return refs
    .map(
      (ref) =>
        `  ${JSON.stringify(ref.path)}: ${moduleNameFor("services", ref.path)}.${ref.exportName}`,
    )
    .join(",\n");
}

function dependencyLayerEntries(refs: readonly ValidDependencyRef[]): string {
  return refs
    .map((ref) => `  ${JSON.stringify(ref.path)}: ${dependencyLayerExprFor(ref)}`)
    .join(",\n");
}

function dependencyLayerExpressionEntries(refs: readonly ValidDependencyRef[]): string {
  return refs.map((ref) => `  ${dependencyLayerExprFor(ref)}`).join(",\n");
}

function concernRuntimeImportsFor(
  kind: ComposableKind,
  source: string,
  emitAllExports: boolean,
): readonly string[] {
  if (kind === "services") {
    return [
      ...(source.includes("Layer.") ? ['import * as Layer from "effect/Layer";'] : []),
      ...(source.includes("Router.") ? ['import * as Router from "@typed/router";'] : []),
    ];
  }
  if (kind === "catch") {
    if (emitAllExports) {
      return [
        'import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";',
        'import * as Cause from "effect/Cause";',
        'import * as Effect from "effect/Effect";',
        'import * as Result from "effect/Result";',
        'import * as Fx from "@typed/fx/Fx";',
      ];
    }
    return [
      ...(source.includes("RefSubject")
        ? ['import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";']
        : []),
      ...(source.includes("Cause.") ? ['import * as Cause from "effect/Cause";'] : []),
      ...(source.includes("Effect.") ? ['import * as Effect from "effect/Effect";'] : []),
      ...(source.includes("Result.") ? ['import * as Result from "effect/Result";'] : []),
      ...(source.includes("Fx.") ? ['import * as Fx from "@typed/fx/Fx";'] : []),
    ];
  }
  return [];
}

function dependencyLayerExprFor(ref: Extract<DependencyRef, { ok: true }>): string {
  const sourceRef = `${moduleNameFor("services", ref.path)}.${ref.exportName}`;
  switch (ref.exportKind) {
    case "layer":
      return sourceRef;
    case "servicemap":
      return `Layer.succeedContext(${sourceRef})`;
    case "array":
      return `Router.normalizeDependencyInput(${sourceRef})`;
  }
}

function normalizedExportMapFor(
  kind: ComposableKind,
  exportName: string,
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
  candidateNames: readonly string[],
  validate?: (ref: Extract<ExportRef, { ok: true }>, api: TypeInfoApi) => ExportRef,
): string | { readonly code: string; readonly reason: string } {
  const refs = concernExportRefsFor(kind, paths, targetDir, api, candidateNames, validate);
  const failed = refs.find((ref) => !ref.ok);
  if (failed && !failed.ok) return failed;
  const entries = refs
    .filter((ref): ref is Extract<ExportRef, { ok: true }> => ref.ok)
    .map(
      (ref) => `  ${JSON.stringify(ref.path)}: ${moduleNameFor(kind, ref.path)}.${ref.exportName}`,
    )
    .join(",\n");
  return `
export const ${exportName} = {
${entries}
} as const;`;
}

function normalizedCatchMapFor(
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
): string | { readonly code: string; readonly reason: string } {
  const refs = concernExportRefsFor("catch", paths, targetDir, api, ["catch", "catchFn"]);
  const failed = refs.find((ref) => !ref.ok);
  if (failed && !failed.ok) return failed;
  const imports = createImportCollector();
  const entries = refs
    .filter((ref): ref is Extract<ExportRef, { ok: true }> => ref.ok)
    .map((ref) => {
      const form = classifyCatchForm(ref.exportInfo.type, api);
      const expr = catchExprFor(
        form,
        moduleNameFor("catch", ref.path),
        ref.exportName,
        imports.helpers,
      );
      return `  ${JSON.stringify(ref.path)}: ${expr}`;
    })
    .join(",\n");
  return `
export const catchers = {
${entries}
} as const;`;
}

function concernExportRefsFor(
  kind: ComposableKind,
  paths: readonly string[],
  targetDir: string,
  api: TypeInfoApi,
  candidateNames: readonly string[],
  validate?: (ref: Extract<ExportRef, { ok: true }>, api: TypeInfoApi) => ExportRef,
): readonly ExportRef[] {
  return paths.map((path) => {
    const snapshot = api.file(path, { baseDir: targetDir, watch: true });
    if (!snapshot.ok) {
      return {
        ok: false,
        code: `CVM-${kind.toUpperCase()}-001`,
        reason: `unable to read ${kind} module type info: ${path}`,
      };
    }
    const ref = resolveExactlyOneExport(snapshot.snapshot, candidateNames, path);
    if (!ref.ok) return ref;
    return validate ? validate(ref, api) : ref;
  });
}

function resolveExactlyOneExport(
  snapshot: TypeInfoFileSnapshot,
  candidateNames: readonly string[],
  path: string,
): ExportRef {
  const matches = snapshot.exports.filter((exp) => candidateNames.includes(exp.name));
  if (matches.length !== 1) {
    return {
      ok: false,
      code: "CVM-EXPORT-001",
      reason: `expected exactly one ${candidateNames.join(", ")} export in ${path}`,
    };
  }
  const exportInfo = matches[0]!;
  return { ok: true, path, exportName: exportInfo.name, exportInfo };
}

function validateGuardRef(ref: Extract<ExportRef, { ok: true }>, api: TypeInfoApi): ExportRef {
  if (!isCallableNode(ref.exportInfo.type)) {
    return {
      ok: false,
      code: "CVM-GUARD-001",
      reason: `guard export must be a function: ${ref.path}`,
    };
  }
  if (!typeNodeIsEffectOptionReturn(ref.exportInfo.type, api)) {
    return {
      ok: false,
      code: "CVM-GUARD-001",
      reason: `guard return type must be Effect<Option<*>, *, *>: ${ref.path}`,
    };
  }
  return ref;
}

type RouteEntrypoint =
  | {
      readonly ok: true;
      readonly exportName: "handler" | "template" | "default";
      readonly runtimeKind: RuntimeKind;
      readonly isFunction: boolean;
      readonly expectsRefSubject: boolean;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string };

function routeEntrypointFor(snapshot: TypeInfoFileSnapshot, api: TypeInfoApi): RouteEntrypoint {
  const entrypoints = snapshot.exports.filter(
    (exp) => exp.name === "handler" || exp.name === "template" || exp.name === "default",
  );
  if (entrypoints.length !== 1) {
    return {
      ok: false,
      code: "CVM-ROUTE-TEMPLATE-001",
      reason: `expected exactly one handler, template, or default export in ${snapshot.filePath}`,
    };
  }
  const entrypoint = entrypoints[0]!;
  const typeForKind = isCallableNode(entrypoint.type)
    ? (getCallableReturnType(entrypoint.type) ?? entrypoint.type)
    : entrypoint.type;
  const runtimeKind = typeNodeToRuntimeKind(typeForKind, api);
  if (runtimeKind === "unknown") {
    return {
      ok: false,
      code: "CVM-ROUTE-TEMPLATE-002",
      reason: `route template runtime kind could not be determined in ${snapshot.filePath}`,
    };
  }
  return {
    ok: true,
    exportName: entrypoint.name as "handler" | "template" | "default",
    runtimeKind,
    isFunction: isCallableNode(entrypoint.type),
    expectsRefSubject: typeNodeExpectsRefSubjectParam(entrypoint.type, api),
  };
}

function createImportCollector(): {
  readonly helpers: RouterExpressionImports;
  readonly lines: () => string;
} {
  const imports = new Map<string, string>();
  const namespace = (name: string, specifier: string): string => {
    imports.set(
      `namespace:${name}:${specifier}`,
      `import * as ${name} from ${JSON.stringify(specifier)};`,
    );
    return name;
  };
  const named = (name: string, specifier: string): string => {
    imports.set(
      `named:${name}:${specifier}`,
      `import { ${name} } from ${JSON.stringify(specifier)};`,
    );
    return name;
  };
  return {
    helpers: {
      router: () => namespace("Router", "@typed/router"),
      fx: () => namespace("Fx", "@typed/fx/Fx"),
      constant: () => named("constant", "effect/Function"),
      effect: () => namespace("Effect", "effect/Effect"),
      cause: () => namespace("Cause", "effect/Cause"),
      result: () => namespace("Result", "effect/Result"),
      layer: () => namespace("Layer", "effect/Layer"),
      refSubject: () => {
        imports.set(
          "type:RefSubject:@typed/fx/RefSubject/RefSubject",
          'import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";',
        );
        return "RefSubject";
      },
    },
    lines: () => [...imports.values()].join("\n") + (imports.size > 0 ? "\n" : ""),
  };
}

function moduleNameFor(kind: ComposableKind, path: string): string {
  if (kind === "services" && path === "_dependencies.ts") return "RootDependencies";
  if (kind === "services" && basename(path) === "_dependencies.ts") {
    return `${pathToIdentifier(stripScriptExtension(dirname(path)))}Dependencies`;
  }
  if (kind === "services" && stripScriptExtension(path).endsWith(".dependencies")) {
    const stem = stripScriptExtension(path).slice(0, -".dependencies".length);
    return `${pathToIdentifier(stem)}Dependencies`;
  }
  return pathToIdentifier(stripScriptExtension(path));
}

function matchesKind(id: string, kind: ComposableKind): boolean {
  const parsed = parseComposableTypedVirtualModuleId(id);
  return parsed.ok && parsed.kind === kind;
}

function resolveTarget(
  id: string,
  importer: string,
  context?: VirtualModuleBuildContext,
):
  | {
      readonly ok: true;
      readonly target: "dir" | "path";
      readonly path: string;
      readonly devtools?: true;
    }
  | { readonly ok: false; readonly code: string; readonly reason: string } {
  const parsed = parseComposableTypedVirtualModuleId(id);
  if (!parsed.ok) return parsed;
  const rootImporter = context?.rootImporter ?? importer;
  const importerDir = dirname(toPosixPath(rootImporter));
  const resolved = resolvePathUnderBase(importerDir, parsed.value);
  if (!resolved.ok || !pathIsUnderBase(importerDir, resolved.path)) {
    return {
      ok: false,
      code: "CVM-ID-TARGET-003",
      reason: "resolved target escapes importer base directory",
    };
  }
  return {
    ok: true,
    target: parsed.target,
    path: toPosixPath(resolved.path),
    ...(parsed.devtools ? { devtools: true } : {}),
  };
}

function normalizeRelativeTarget(
  value: string,
  name: string,
):
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly code: string; readonly reason: string } {
  if (value.includes("://") || value.startsWith("/")) {
    return { ok: false, code: "CVM-ID-TARGET-002", reason: `${name} must be a relative path` };
  }
  if (!value.startsWith("./") && !value.startsWith("../")) {
    return { ok: false, code: "CVM-ID-TARGET-002", reason: `${name} must be a relative path` };
  }
  return { ok: true, value };
}

function buildError(
  kind: ComposableKind,
  error: string | { readonly code: string; readonly reason: string },
): VirtualModuleBuildError {
  return {
    errors: [
      {
        code: typeof error === "string" ? "CVM-BUILD-001" : error.code,
        message: typeof error === "string" ? error : error.reason,
        pluginName: `typed-${kind}-virtual-module`,
      },
    ],
  };
}

function isExistingDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function toImportSpecifier(
  importerDir: string,
  targetDir: string,
  relativeFilePath: string,
): string {
  const absPath = join(targetDir, relativeFilePath);
  const rel = toPosixPath(relative(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
}
