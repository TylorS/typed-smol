import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  toPosixPath,
} from "./internal/path.js";
import {
  buildHttpApiDescriptorTree,
  type HttpApiEndpointNode,
  type HttpApiTreeNode,
} from "./internal/httpapiDescriptorTree.js";
import { classifyHttpApiFileRole } from "./internal/httpapiFileRoles.js";
import {
  emitHttpApiSource,
  type HttpApiExportExpression,
  type HttpApiExportExpressionImport,
} from "./internal/emitHttpApiSource.js";
import { extractEndpointLiterals } from "./internal/extractHttpApiLiterals.js";
import { validatePrefixConventions } from "./internal/validatePrefixConventions.js";
import { buildHttpApiOpenApiPlan } from "./internal/httpapiOpenApiPlan.js";
import { TypeModuleSource, typeUnion } from "./internal/typeModuleSource.js";
import {
  getCallableReturnType,
  isCallableNode,
  typeNodeIsRouteCompatible,
} from "./internal/routeTypeNode.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type {
  ImportInfo,
  TypeInfoApi,
  TypeInfoFileSnapshot,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { HTTPAPI_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const DEFAULT_PREFIX = "api:";
const DEFAULT_PLUGIN_NAME = "httpapi-virtual-module";
const API_TYPES_MODULE_ID = "./$api-types";

/** Extensions that count as script files when checking if a directory should resolve. */
const SCRIPT_EXTENSION_SET = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
]);

/** Glob patterns for discovering API source files. */
const API_FILE_GLOBS: readonly string[] = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mts",
  "**/*.cts",
  "**/*.mjs",
  "**/*.cjs",
];

const REQUIRED_ENDPOINT_EXPORTS = ["route", "method", "handler"] as const;

export interface HttpApiVirtualModulePluginOptions {
  readonly prefix?: string;
  readonly name?: string;
  /** HTTP path prefix for all endpoints when conventions do not define one (e.g. "/api"). */
  readonly pathPrefix?: `/${string}`;
}

export type HttpApiVirtualModuleMode = "full" | "client";

export type ParseHttpApiVirtualModuleIdResult =
  | {
      readonly ok: true;
      readonly relativeDirectory: string;
      readonly mode: HttpApiVirtualModuleMode;
    }
  | { readonly ok: false; readonly reason: string };

export function parseHttpApiVirtualModuleId(
  id: string,
  prefix: string = DEFAULT_PREFIX,
): ParseHttpApiVirtualModuleIdResult {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) return { ok: false, reason: idResult.reason };
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok) return { ok: false, reason: prefixResult.reason };
  if (!id.startsWith(prefix)) {
    return { ok: false, reason: `id must start with "${prefix}"` };
  }

  const body = id.slice(prefix.length);
  const separatorIndex = body.indexOf("?");
  let relativeDirectory = separatorIndex === -1 ? body : body.slice(0, separatorIndex);
  const params = new URLSearchParams(separatorIndex === -1 ? "" : body.slice(separatorIndex + 1));
  const mode = params.get("mode") ?? "full";
  const unsupported = [...params.keys()].find((key) => key !== "mode");
  if (unsupported !== undefined) {
    return {
      ok: false,
      reason: `api virtual module does not support query option "${unsupported}"`,
    };
  }
  if (mode !== "full" && mode !== "client") {
    return {
      ok: false,
      reason: 'api virtual module mode must be one of "full" or "client"',
    };
  }
  if (
    relativeDirectory.length > 0 &&
    relativeDirectory !== "." &&
    relativeDirectory !== ".." &&
    !relativeDirectory.startsWith("./") &&
    !relativeDirectory.startsWith("../") &&
    !relativeDirectory.startsWith("/")
  ) {
    relativeDirectory = `./${relativeDirectory}`;
  }
  const relativeResult = validatePathSegment(relativeDirectory, "relativeDirectory");
  if (!relativeResult.ok) return { ok: false, reason: relativeResult.reason };

  return { ok: true, relativeDirectory: relativeResult.value, mode };
}

export type ResolveHttpApiTargetDirectoryResult =
  | {
      readonly ok: true;
      readonly targetDirectory: string;
      readonly mode: HttpApiVirtualModuleMode;
    }
  | { readonly ok: false; readonly reason: string };

export function resolveHttpApiTargetDirectory(
  id: string,
  importer: string,
  prefix: string = DEFAULT_PREFIX,
): ResolveHttpApiTargetDirectoryResult {
  const parsed = parseHttpApiVirtualModuleId(id, prefix);
  if (!parsed.ok) return parsed;

  const importerResult = validatePathSegment(importer, "importer");
  if (!importerResult.ok) return { ok: false, reason: importerResult.reason };

  const importerDir = dirname(toPosixPath(importerResult.value));
  const resolved = resolvePathUnderBase(importerDir, parsed.relativeDirectory);
  if (!resolved.ok) {
    return { ok: false, reason: "resolved target directory escapes importer base directory" };
  }
  if (!pathIsUnderBase(importerDir, resolved.path)) {
    return { ok: false, reason: "resolved target directory is outside importer base directory" };
  }

  return { ok: true, targetDirectory: toPosixPath(resolved.path), mode: parsed.mode };
}

function isExistingDirectory(absolutePath: string): boolean {
  try {
    return statSync(absolutePath).isDirectory();
  } catch {
    return false;
  }
}

function directoryHasScriptFiles(dir: string): boolean {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const e of items) {
      if (
        e.isFile() &&
        SCRIPT_EXTENSION_SET.has(extname(e.name).toLowerCase()) &&
        !e.name.toLowerCase().endsWith(".d.ts")
      )
        return true;
      if (e.isDirectory() && directoryHasScriptFiles(join(dir, e.name))) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function collectEndpointNodes(nodes: readonly HttpApiTreeNode[]): HttpApiEndpointNode[] {
  const collected: HttpApiEndpointNode[] = [];
  for (const node of nodes) {
    if (node.type === "endpoint") {
      collected.push(node);
      continue;
    }
    collected.push(...collectEndpointNodes(node.children));
  }
  return collected;
}

function mapSnapshotsByRelativePath(
  snapshots: readonly TypeInfoFileSnapshot[],
  targetDirectory: string,
): ReadonlyMap<string, TypeInfoFileSnapshot> {
  const byPath = new Map<string, TypeInfoFileSnapshot>();
  for (const snapshot of snapshots) {
    const relativePath = toPosixPath(relative(targetDirectory, snapshot.filePath));
    byPath.set(relativePath, snapshot);
  }
  return byPath;
}

function validateEndpointContracts(
  endpoints: readonly HttpApiEndpointNode[],
  snapshotsByPath: ReadonlyMap<string, TypeInfoFileSnapshot>,
  api: TypeInfoApi,
): readonly { code: string; message: string }[] {
  const violations: Array<{ code: string; message: string }> = [];
  for (const endpoint of endpoints) {
    const snapshot = snapshotsByPath.get(endpoint.path);
    if (!snapshot) {
      violations.push({
        code: "AVM-CONTRACT-001",
        message: `endpoint module not found in TypeInfo snapshot set: ${endpoint.path}`,
      });
      continue;
    }
    const exportedNames = new Set(snapshot.exports.map((exported) => exported.name));
    const missing = REQUIRED_ENDPOINT_EXPORTS.filter((name) => !exportedNames.has(name));
    if (missing.length > 0) {
      violations.push({
        code: "AVM-CONTRACT-002",
        message: `endpoint "${endpoint.path}" missing required export(s): ${missing.join(", ")}`,
      });
      continue;
    }
    const routeExport = snapshot.exports.find((e) => e.name === "route");
    if (!routeExport) continue;
    if (!typeNodeIsRouteCompatible(routeExport.type, api)) {
      const hint = "; route must be assignable to Route from @typed/router";
      violations.push({
        code: "AVM-CONTRACT-003",
        message: `endpoint "${endpoint.path}" route: export must be Route (Parse, Param, Join, etc.) from @typed/router${hint}`,
      });
    }
    const handlerExport = snapshot.exports.find((e) => e.name === "handler");
    if (handlerExport) {
      const handlerNode = isCallableNode(handlerExport.type)
        ? (getCallableReturnType(handlerExport.type) ?? handlerExport.type)
        : handlerExport.type;
      const handlerReturnsEffect = api.isAssignableTo(handlerNode, "Effect");
      if (!handlerReturnsEffect) {
        violations.push({
          code: "AVM-CONTRACT-004",
          message: `endpoint "${endpoint.path}" handler: return type must be Effect`,
        });
      }
    }
    const successExport = snapshot.exports.find((e) => e.name === "success");
    if (successExport && !api.isAssignableTo(successExport.type, "Schema")) {
      violations.push({
        code: "AVM-CONTRACT-005",
        message: `endpoint "${endpoint.path}" success: export must be Schema when present`,
      });
    }
    const errorExport = snapshot.exports.find((e) => e.name === "error");
    if (errorExport && !api.isAssignableTo(errorExport.type, "Schema")) {
      violations.push({
        code: "AVM-CONTRACT-006",
        message: `endpoint "${endpoint.path}" error: export must be Schema when present`,
      });
    }
  }
  return violations.sort((a, b) => a.message.localeCompare(b.message, "en"));
}

function extractExportExpressionsByPath(
  snapshotsByPath: ReadonlyMap<string, TypeInfoFileSnapshot>,
): ReadonlyMap<string, ReadonlyMap<string, HttpApiExportExpression>> {
  return new Map(
    [...snapshotsByPath].map(([path, snapshot]) => [
      path,
      new Map(
        snapshot.exports.flatMap((exported) => {
          const expression = extractConstExportExpression(exported.declarationText);
          if (!expression) return [];
          return [
            [
              exported.name,
              {
                expression,
                imports: importsForExpression(expression, snapshot.imports ?? []),
              } satisfies HttpApiExportExpression,
            ],
          ];
        }),
      ),
    ]),
  );
}

function extractConstExportExpression(declarationText: string | undefined): string | undefined {
  if (!declarationText) return undefined;
  const match = declarationText.match(
    /^(?:export\s+)?(?:const\s+)?\w+\s*(?::[^=]+)?=\s*([\s\S]*?);?$/,
  );
  return match?.[1]?.trim();
}

function importsForExpression(
  expression: string,
  imports: readonly ImportInfo[],
): readonly HttpApiExportExpressionImport[] {
  const specs: HttpApiExportExpressionImport[] = [];
  for (const imported of imports) {
    for (const name of imported.importedNames ?? []) {
      const [importedName, localName] = splitNamedImport(name);
      if (!referencesIdentifier(expression, localName)) continue;
      specs.push({
        kind: "named",
        moduleSpecifier: imported.moduleSpecifier,
        importedName,
        localName,
      });
    }
    if (imported.namespaceImport && referencesIdentifier(expression, imported.namespaceImport)) {
      specs.push({
        kind: "namespace",
        moduleSpecifier: imported.moduleSpecifier,
        localName: imported.namespaceImport,
      });
    }
    if (imported.defaultImport && referencesIdentifier(expression, imported.defaultImport)) {
      specs.push({
        kind: "default",
        moduleSpecifier: imported.moduleSpecifier,
        localName: imported.defaultImport,
      });
    }
  }
  return specs;
}

function splitNamedImport(name: string): readonly [importedName: string, localName: string] {
  const match = name.match(/^(.+)\s+as\s+(.+)$/);
  return match ? [match[1]!.trim(), match[2]!.trim()] : [name, name];
}

function referencesIdentifier(expression: string, identifier: string): boolean {
  return new RegExp(`\\b${escapeRegExp(identifier)}\\b`).test(expression);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emitApiTypesModule(
  importer: string,
  api: TypeInfoApi,
  pluginName: string,
): string | VirtualModuleBuildError {
  const source = api.file(`./${basename(importer)}`, { baseDir: dirname(importer), watch: true });
  if (!source.ok) {
    return {
      errors: [
        {
          code: "AVM-TYPES-001",
          message: `could not inspect API source for ${API_TYPES_MODULE_ID}: ${source.error}`,
          pluginName,
        },
      ],
    };
  }

  const routeExport = source.snapshot.exports.find((value) => value.name === "route");
  if (!routeExport) {
    return {
      errors: [
        {
          code: "AVM-TYPES-002",
          message: `API type module requires a "route" export in ${source.snapshot.filePath}`,
          pluginName,
        },
      ],
    };
  }
  if (!typeNodeIsRouteCompatible(routeExport.type, api)) {
    return {
      errors: [
        {
          code: "AVM-TYPES-003",
          message: `route export is not structurally compatible with Route in ${source.snapshot.filePath}`,
          pluginName,
        },
      ],
    };
  }
  if (!source.snapshot.exports.some((value) => value.name === "method")) {
    return {
      errors: [
        {
          code: "AVM-TYPES-004",
          message: `API type module requires a "method" export in ${source.snapshot.filePath}`,
          pluginName,
        },
      ],
    };
  }

  return emitApiTypesSource(
    importer,
    api,
    new Set(source.snapshot.exports.map((value) => value.name)),
  );
}

type ApiCompanionKind = "dependencies" | "headers" | "error" | "middlewares" | "prefix" | "openapi";

type ApiCompanionImport = {
  readonly alias: string;
  readonly moduleSpecifier: string;
};

const API_DIRECTORY_COMPANION_BY_KIND = {
  dependencies: "_dependencies.ts",
  headers: "_headers.ts",
  error: "_errors.ts",
  middlewares: "_middlewares.ts",
  prefix: "_prefix.ts",
  openapi: "_openapi.ts",
} as const satisfies Record<ApiCompanionKind, string>;

const API_ENDPOINT_COMPANION_BY_KIND = {
  dependencies: ".dependencies.ts",
  middlewares: ".middlewares.ts",
  prefix: ".prefix.ts",
  openapi: ".openapi.ts",
  name: ".name.ts",
} as const;

function emitApiTypesSource(
  importer: string,
  api: TypeInfoApi,
  exportNames: ReadonlySet<string>,
): string {
  const moduleSpecifier = endpointModuleSpecifier(importer);
  const dependencies = apiCompanionImports(api, importer, "dependencies", "InheritedDependencies");
  const headers = apiCompanionImports(api, importer, "headers", "InheritedHeaders");
  const errors = apiCompanionImports(api, importer, "error", "InheritedErrors");
  const middlewares = apiCompanionImports(api, importer, "middlewares", "InheritedMiddlewares");
  const prefixes = apiCompanionImports(api, importer, "prefix", "InheritedPrefixes");
  const openApis = apiCompanionImports(api, importer, "openapi", "InheritedOpenApis");
  const endpointDependencies = apiEndpointCompanionImport(
    api,
    importer,
    "dependencies",
    "EndpointDependencies",
  );
  const endpointMiddlewares = apiEndpointCompanionImport(
    api,
    importer,
    "middlewares",
    "EndpointMiddlewares",
  );
  const endpointPrefix = apiEndpointCompanionImport(api, importer, "prefix", "EndpointPrefix");
  const endpointOpenApi = apiEndpointCompanionImport(api, importer, "openapi", "EndpointOpenApi");
  const endpointName = apiEndpointNameImport(api, importer);
  const importedCompanions = [
    ...dependencies,
    ...errors,
    ...headers,
    ...middlewares,
    ...prefixes,
    ...openApis,
    endpointDependencies,
    endpointMiddlewares,
    endpointPrefix,
    endpointOpenApi,
    endpointName,
  ].filter((value): value is ApiCompanionImport => value !== undefined);
  const source = new TypeModuleSource();
  source.importLine(
    `import type { ApiHandlerFromConfig, ApiHandlerParamsFromConfig, ApiHandlerRawFromConfig } from "@typed/app/httpapi/ApiHandler";`,
  );
  source.importTypeNamespace("EndpointModule", moduleSpecifier);
  for (const value of importedCompanions) {
    source.importTypeNamespace(value.alias, value.moduleSpecifier);
  }
  const inheritedHeadersType = last(headers)
    ? `{ readonly headers: typeof ${last(headers)!.alias}.headers }`
    : "{}";
  const inheritedErrorType = last(errors)
    ? `{ readonly error: typeof ${last(errors)!.alias}.error }`
    : "{}";
  const dependencyEntries = apiCompanionTypeEntries(
    source,
    "dependencies",
    dependencies,
    endpointDependencies,
    exportNames,
  );
  const middlewareEntries = apiCompanionTypeEntries(
    source,
    "middlewares",
    middlewares,
    endpointMiddlewares,
    exportNames,
  );
  const prefixEntries = apiCompanionTypeEntries(
    source,
    "prefix",
    prefixes,
    endpointPrefix,
    exportNames,
  );
  const openApiEntries = apiCompanionTypeEntries(
    source,
    "openapi",
    openApis,
    endpointOpenApi,
    exportNames,
  );
  const nameType = apiNameType(endpointName, exportNames);

  source.add("type Endpoint = typeof EndpointModule;");
  source.add(`type ExportValue<T, Name extends PropertyKey> = T extends { readonly [K in Name]: infer Value }
  ? Value
  : never;`);
  source.add(`type OptionalHeaders<T> = T extends { readonly headers: infer Headers }
  ? { readonly headers: Headers }
  : ${inheritedHeadersType};

type OptionalBody<T> = T extends { readonly body: infer Body }
  ? { readonly body: Body }
  : {};

type OptionalSuccess<T> = T extends { readonly success: infer Success }
  ? { readonly success: Success }
  : {};

type OptionalError<T> = T extends { readonly error: infer Error }
  ? { readonly error: Error }
  : ${inheritedErrorType};`);

  source.add(`export type Config = {
  readonly route: Endpoint["route"];
  readonly method: Endpoint["method"];
} & OptionalHeaders<Endpoint> & OptionalBody<Endpoint> & OptionalSuccess<Endpoint> & OptionalError<Endpoint>;

export type Route = Config["route"];

export type Method = Config["method"];

export type Headers = Config extends { readonly headers: infer Headers } ? Headers : never;

export type Body = Config extends { readonly body: infer Body } ? Body : never;

export type Success = Config extends { readonly success: infer Success } ? Success : never;

export type Error = Config extends { readonly error: infer Error } ? Error : never;

export type Dependencies = ${typeUnion(dependencyEntries)};

export type Middlewares = ${typeUnion(middlewareEntries)};

export type Prefixes = ${typeUnion(prefixEntries)};

export type OpenApis = ${typeUnion(openApiEntries)};

export type Name = ${nameType};

export type ApiTypes = {
  readonly route: Route;
  readonly method: Method;
  readonly headers: Headers;
  readonly body: Body;
  readonly success: Success;
  readonly error: Error;
  readonly dependencies: Dependencies;
  readonly middlewares: Middlewares;
  readonly prefixes: Prefixes;
  readonly openApis: OpenApis;
  readonly name: Name;
};

export type Context = ApiHandlerParamsFromConfig<Config>;

export type Handler<R = any> = ApiHandlerFromConfig<Config, R>;

export type RawHandler<R = any> = ApiHandlerRawFromConfig<Config, R>;`);

  return source.emit();
}

function defaultOrExportHelper(source: TypeModuleSource): string {
  source.helper(
    "DefaultValue",
    "type DefaultValue<T> = T extends { readonly default: infer Value } ? Value : never;",
  );
  return source.helper(
    "DefaultOrExport",
    `type DefaultOrExport<T, Name extends PropertyKey> = [DefaultValue<T>] extends [never]
  ? ExportValue<T, Name>
  : DefaultValue<T>;`,
  );
}

function endpointModuleSpecifier(importer: string): string {
  return `./${basename(importer).replace(/\.[cm]?[tj]sx?$/, ".js")}`;
}

function apiCompanionImports(
  api: TypeInfoApi,
  importer: string,
  kind: ApiCompanionKind,
  aliasPrefix: string,
): readonly ApiCompanionImport[] {
  const paths: string[] = [];
  let current = dirname(importer);
  while (true) {
    const candidate = join(current, API_DIRECTORY_COMPANION_BY_KIND[kind]);
    if (existsSync(candidate)) {
      watchCompanion(api, importer, candidate);
      paths.push(candidate);
    }

    const parent = dirname(current);
    if (parent === current)
      return paths
        .reverse()
        .map((path, index) => apiCompanionImport(importer, path, `${aliasPrefix}${index}`));
    current = parent;
  }
}

function apiEndpointCompanionImport(
  api: TypeInfoApi,
  importer: string,
  kind: keyof typeof API_ENDPOINT_COMPANION_BY_KIND,
  alias: string,
): ApiCompanionImport | undefined {
  const target = join(
    dirname(importer),
    `${basename(importer).replace(/\.[cm]?[tj]sx?$/, "")}${API_ENDPOINT_COMPANION_BY_KIND[kind]}`,
  );
  if (!existsSync(target)) return undefined;
  watchCompanion(api, importer, target);
  return apiCompanionImport(importer, target, alias);
}

function apiEndpointNameImport(api: TypeInfoApi, importer: string): ApiCompanionImport | undefined {
  return apiEndpointCompanionImport(api, importer, "name", "EndpointName");
}

function apiCompanionImport(importer: string, target: string, alias: string): ApiCompanionImport {
  return { alias, moduleSpecifier: moduleSpecifierFrom(dirname(importer), target) };
}

function apiCompanionTypeEntries(
  source: TypeModuleSource,
  kind: ApiCompanionKind,
  inherited: readonly ApiCompanionImport[],
  endpoint: ApiCompanionImport | undefined,
  exportNames: ReadonlySet<string>,
): readonly string[] {
  const hasInFile = exportNames.has(kind);
  if (!hasInFile && inherited.length === 0 && endpoint === undefined) return [];
  const valueType = apiCompanionValueType(source, kind);
  const inFile = hasInFile ? `${valueType}<Endpoint>` : undefined;
  const imported = inherited.map(({ alias }) => `${valueType}<typeof ${alias}>`);
  const endpointType = endpoint ? `${valueType}<typeof ${endpoint.alias}>` : undefined;
  return [...imported, endpointType, inFile].filter(
    (value): value is string => value !== undefined,
  );
}

function apiCompanionValueType(source: TypeModuleSource, kind: ApiCompanionKind): string {
  if (kind === "dependencies") {
    const helper = defaultOrExportHelper(source);
    return source.helper(
      "DependencyValue",
      `type DependencyValue<T> = ${helper}<T, "dependencies">;`,
    );
  }
  if (kind === "middlewares") {
    const helper = defaultOrExportHelper(source);
    return source.helper(
      "MiddlewareValue",
      `type MiddlewareValue<T> = [ExportValue<T, "middleware">] extends [never]
  ? ${helper}<T, "middlewares">
  : ExportValue<T, "middleware">;`,
    );
  }
  if (kind === "prefix") {
    const helper = defaultOrExportHelper(source);
    return source.helper("PrefixValue", `type PrefixValue<T> = ${helper}<T, "prefix">;`);
  }
  const helper = defaultOrExportHelper(source);
  return source.helper("OpenApiValue", `type OpenApiValue<T> = ${helper}<T, "openapi">;`);
}

function apiNameType(
  endpointName: ApiCompanionImport | undefined,
  exportNames: ReadonlySet<string>,
): string {
  if (exportNames.has("name")) return 'ExportValue<Endpoint, "name">';
  return endpointName ? `ExportValue<typeof ${endpointName.alias}, "name">` : "never";
}

function last<A>(values: readonly A[]): A | undefined {
  return values[values.length - 1];
}

function watchCompanion(api: TypeInfoApi, importer: string, target: string): void {
  const relativePath = toPosixPath(relative(dirname(importer), target));
  const withDot = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  api.file(withDot, {
    baseDir: dirname(importer),
    watch: true,
  });
}

function moduleSpecifierFrom(fromDir: string, target: string): string {
  const relativePath = toPosixPath(relative(fromDir, target));
  const withDot = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  return withDot.replace(/\.[cm]?[tj]sx?$/, ".js");
}

/**
 * Creates the HttpApi virtual module plugin with sync shouldResolve and build behavior.
 */
export const createHttpApiVirtualModulePlugin = (
  options: HttpApiVirtualModulePluginOptions = {},
): VirtualModulePlugin => {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    typeTargetSpecs: HTTPAPI_TYPE_TARGET_SPECS,
    shouldResolve(id, importer) {
      if (id === API_TYPES_MODULE_ID && importer) return true;
      const resolved = resolveHttpApiTargetDirectory(id, importer, prefix);
      if (!resolved.ok) return false;
      if (!isExistingDirectory(resolved.targetDirectory)) return false;
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
      if (id === API_TYPES_MODULE_ID) {
        return emitApiTypesModule(importer, api, name);
      }

      const resolved = resolveHttpApiTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return {
          errors: [{ code: "AVM-ID-001", message: resolved.reason, pluginName: name }],
        } satisfies VirtualModuleBuildError;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return {
          errors: [
            {
              code: "AVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath(dirname(importer), resolved.targetDirectory)}`,
              pluginName: name,
            },
          ],
        } satisfies VirtualModuleBuildError;
      }

      const snapshots = api.directory(API_FILE_GLOBS, {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true,
      });

      if (snapshots.length === 0) {
        return {
          errors: [
            {
              code: "AVM-LEAF-001",
              message: `no API source files discovered in ${resolved.targetDirectory}`,
              pluginName: name,
            },
          ],
        } satisfies VirtualModuleBuildError;
      }

      const snapshotsByRelativePath = mapSnapshotsByRelativePath(
        snapshots,
        resolved.targetDirectory,
      );
      const relativePaths = [...snapshotsByRelativePath.keys()].sort((a, b) =>
        a.localeCompare(b, "en"),
      );
      const roles = relativePaths.map((path) => classifyHttpApiFileRole(path));
      const tree = buildHttpApiDescriptorTree({ roles });
      const endpoints = collectEndpointNodes(tree.children);

      if (endpoints.length === 0) {
        return {
          errors: [
            {
              code: "AVM-LEAF-001",
              message: `no valid API endpoint leaves discovered in ${resolved.targetDirectory}`,
              pluginName: name,
            },
          ],
        } satisfies VirtualModuleBuildError;
      }

      const contractViolations = validateEndpointContracts(endpoints, snapshotsByRelativePath, api);
      const { violations: prefixViolations, prefixByScope } = validatePrefixConventions(
        tree,
        snapshotsByRelativePath,
        api,
      );
      const openapiPlan = buildHttpApiOpenApiPlan({ tree, snapshotsByRelativePath });
      const allViolations = [
        ...contractViolations,
        ...prefixViolations,
        ...openapiPlan.diagnostics,
      ];
      if (allViolations.length > 0) {
        return {
          errors: allViolations.map((violation) => ({
            code: violation.code,
            message: violation.message,
            pluginName: name,
          })),
        } satisfies VirtualModuleBuildError;
      }

      const extractedLiteralsByPath = new Map<
        string,
        { path: string; method: string; name: string }
      >();
      const exportExpressionsByPath = extractExportExpressionsByPath(snapshotsByRelativePath);
      const optionalExportsByPath = new Map<
        string,
        ReadonlySet<"headers" | "body" | "success" | "error">
      >();
      const handlerIsRawByPath = new Map<string, boolean>();
      const OPTIONAL_NAMES = ["headers", "body", "success", "error"] as const;
      for (const endpoint of endpoints) {
        const snapshot = snapshotsByRelativePath.get(endpoint.path);
        if (snapshot) {
          const literals = extractEndpointLiterals(snapshot, endpoint.stem);
          extractedLiteralsByPath.set(endpoint.path, literals);
          const exportedNames = new Set(snapshot.exports.map((e) => e.name));
          const present = new Set(
            OPTIONAL_NAMES.filter((n) => exportedNames.has(n)),
          ) as ReadonlySet<"headers" | "body" | "success" | "error">;
          optionalExportsByPath.set(endpoint.path, present);
          const handlerExport = snapshot.exports.find((e) => e.name === "handler");
          if (
            handlerExport != null &&
            api.isAssignableTo(handlerExport.type, "HttpServerResponse", [
              { kind: "returnType" },
              { kind: "typeArg", index: 0 },
            ])
          ) {
            handlerIsRawByPath.set(endpoint.path, true);
          }
        }
      }

      const sourceText = emitHttpApiSource({
        tree,
        targetDirectory: resolved.targetDirectory,
        importer,
        extractedLiteralsByPath,
        optionalExportsByPath,
        handlerIsRawByPath,
        prefixByScope,
        pathPrefix: options.pathPrefix,
        openapiPlan,
        mode: resolved.mode === "client" ? "client" : "full",
        exportExpressionsByPath,
      });
      if (tree.diagnostics.length > 0) {
        return {
          sourceText,
          warnings: tree.diagnostics.map((diagnostic) => ({
            code: diagnostic.code,
            message: diagnostic.message,
            pluginName: name,
          })),
        };
      }

      return sourceText;
    },
  };
};
