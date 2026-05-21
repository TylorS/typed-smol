import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import {
  buildRouteDescriptors,
  type RouteContractViolation,
} from "./internal/buildRouteDescriptors.js";
import { emitRouterMatchSource } from "./internal/emitRouterSource.js";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  stripScriptExtension,
  toPosixPath,
} from "./internal/path.js";
import { typeNodeIsRouteCompatible } from "./internal/routeTypeNode.js";
import {
  dependencyLayerType,
  TypeModuleSource,
  typeTuple,
  typeUnion,
} from "./internal/typeModuleSource.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type {
  TypeInfoApi,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { ROUTER_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const DEFAULT_PREFIX = "router:";
const DEFAULT_PLUGIN_NAME = "router-virtual-module";
const ROUTE_TYPES_MODULE_ID = "./$route-types";

/** Extensions that count as route/script files when checking if a directory should resolve. */
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

/** Glob patterns for discovering route files. */
const ROUTE_FILE_GLOBS: readonly string[] = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mts",
  "**/*.cts",
  "**/*.mjs",
  "**/*.cjs",
];

export interface RouterVirtualModulePluginOptions {
  readonly prefix?: string;
  readonly name?: string;
}

export type ParseRouterVirtualModuleIdResult =
  | { readonly ok: true; readonly relativeDirectory: string }
  | { readonly ok: false; readonly reason: string };

export function parseRouterVirtualModuleId(
  id: string,
  prefix: string = DEFAULT_PREFIX,
): ParseRouterVirtualModuleIdResult {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) return { ok: false, reason: idResult.reason };
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok) return { ok: false, reason: prefixResult.reason };
  if (!id.startsWith(prefix)) {
    return { ok: false, reason: `id must start with "${prefix}"` };
  }

  const body = id.slice(prefix.length);
  const separatorIndex = body.indexOf("?");
  const rawRelativeDirectory = separatorIndex === -1 ? body : body.slice(0, separatorIndex);
  const params = new URLSearchParams(separatorIndex === -1 ? "" : body.slice(separatorIndex + 1));
  const unsupported = [...params.keys()][0];
  if (unsupported !== undefined) {
    return {
      ok: false,
      reason: `router virtual module does not support query option "${unsupported}"`,
    };
  }

  let relativeDirectory = rawRelativeDirectory;
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

  return { ok: true, relativeDirectory: relativeResult.value };
}

export type ResolveRouterTargetDirectoryResult =
  | { readonly ok: true; readonly targetDirectory: string }
  | { readonly ok: false; readonly reason: string };

export function resolveRouterTargetDirectory(
  id: string,
  importer: string,
  prefix: string = DEFAULT_PREFIX,
): ResolveRouterTargetDirectoryResult {
  const parsed = parseRouterVirtualModuleId(id, prefix);
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

  return { ok: true, targetDirectory: toPosixPath(resolved.path) };
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

const FAIL_ORDER: RouteContractViolation["code"][] = [
  "RVM-AMBIGUOUS-001",
  "RVM-GUARD-001",
  "RVM-CATCH-001",
  "RVM-DEPS-001",
  "RVM-KIND-001",
];

function failOnViolations(
  violations: readonly RouteContractViolation[],
  toDiagnostic: (v: RouteContractViolation) => {
    code: string;
    message: string;
    pluginName: string;
  },
): VirtualModuleBuildError | null {
  for (const code of FAIL_ORDER) {
    const found = violations.filter((v) => v.code === code);
    if (found.length > 0) return { errors: found.map(toDiagnostic) };
  }
  return null;
}

export const createRouterVirtualModulePlugin = (
  options: RouterVirtualModulePluginOptions = {},
): VirtualModulePlugin => {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    shouldResolve(id, importer) {
      if (id === ROUTE_TYPES_MODULE_ID && importer) return true;
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) return false;
      if (!isExistingDirectory(resolved.targetDirectory)) return false;
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
      if (id === ROUTE_TYPES_MODULE_ID) {
        return emitRouteTypesModule(importer, api, name);
      }

      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return {
          errors: [{ code: "RVM-ID-001", message: resolved.reason, pluginName: name }],
        } satisfies VirtualModuleBuildError;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return {
          errors: [
            {
              code: "RVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath(dirname(importer), resolved.targetDirectory)}`,
              pluginName: name,
            },
          ],
        } satisfies VirtualModuleBuildError;
      }

      const snapshots = api.directory(ROUTE_FILE_GLOBS, {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true,
      });
      const {
        descriptors,
        violations,
        guardExportByPath,
        catchExportByPath,
        catchFormByPath,
        depsFormByPath,
      } = buildRouteDescriptors(snapshots, resolved.targetDirectory, api);

      const toDiagnostic = (v: RouteContractViolation) => ({
        code: v.code,
        message: v.message,
        pluginName: name,
      });

      const err = failOnViolations(violations, toDiagnostic);
      if (err) return err;

      if (descriptors.length === 0) {
        if (violations.length > 0) {
          return { errors: violations.map(toDiagnostic) };
        }
        return {
          errors: [
            {
              code: "RVM-LEAF-001",
              message: `no valid route leaves discovered in ${resolved.targetDirectory}`,
              pluginName: name,
            },
          ],
        };
      }

      return emitRouterMatchSource(
        descriptors,
        resolved.targetDirectory,
        importer,
        guardExportByPath,
        catchExportByPath,
        catchFormByPath,
        depsFormByPath,
      );
    },
  };
};

function emitRouteTypesModule(
  importer: string,
  api: TypeInfoApi,
  pluginName: string,
): string | VirtualModuleBuildError {
  const source = api.file(`./${basename(importer)}`, { baseDir: dirname(importer), watch: true });
  if (!source.ok) {
    return {
      errors: [
        {
          code: "RVM-TYPES-001",
          message: `could not inspect route source for ${ROUTE_TYPES_MODULE_ID}: ${source.error}`,
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
          code: "RVM-TYPES-002",
          message: `route type module requires a "route" export in ${source.snapshot.filePath}`,
          pluginName,
        },
      ],
    };
  }
  if (!typeNodeIsRouteCompatible(routeExport.type, api)) {
    return {
      errors: [
        {
          code: "RVM-TYPES-003",
          message: `route export is not structurally compatible with Route in ${source.snapshot.filePath}`,
          pluginName,
        },
      ],
    };
  }

  return emitRouteTypesSource(
    importer,
    api,
    new Set(source.snapshot.exports.map((value) => value.name)),
  );
}

type RouteConcern = "dependencies" | "guard" | "layout" | "catch";

type RouteConcernImport = {
  readonly alias: string;
  readonly moduleSpecifier: string;
  readonly path: string;
};

const ROUTE_DIRECTORY_COMPANION_BY_CONCERN = {
  dependencies: "_dependencies.ts",
  guard: "_guard.ts",
  layout: "_layout.ts",
  catch: "_catch.ts",
} as const satisfies Record<RouteConcern, string>;

const ROUTE_SIBLING_SUFFIX_BY_CONCERN = {
  dependencies: ".dependencies.ts",
  guard: ".guard.ts",
  layout: ".layout.ts",
  catch: ".catch.ts",
} as const satisfies Record<RouteConcern, string>;

function emitRouteTypesSource(
  importer: string,
  api: TypeInfoApi,
  exportNames: ReadonlySet<string>,
): string {
  const moduleSpecifier = routeModuleSpecifier(importer);
  const source = new TypeModuleSource();
  const dependencies = routeConcernImports(api, importer, "dependencies", "RouteDependencies");
  const guards = routeConcernImports(api, importer, "guard", "RouteGuards");
  const layouts = routeConcernImports(api, importer, "layout", "RouteLayouts");
  const catches = routeConcernImports(api, importer, "catch", "RouteCatches");
  for (const value of [...dependencies, ...guards, ...layouts, ...catches]) {
    source.importTypeNamespace(value.alias, value.moduleSpecifier);
  }
  const dependencyEntries = routeConcernTypeEntries(
    source,
    "dependencies",
    dependencies,
    exportNames,
  );
  const guardEntries = routeComposedConcernTypeEntries(source, "guard", guards, exportNames);
  const layoutEntries = routeComposedConcernTypeEntries(source, "layout", layouts, exportNames);
  const catchEntries = routeComposedConcernTypeEntries(source, "catch", catches, exportNames);
  const dependenciesType = dependencyLayerType(source, dependencyEntries);
  const guardsType = routeComposedGuardsType(source, guardEntries);
  const layoutsType = routeComposedLayoutsType(source, layoutEntries);
  const catchesType = routeComposedCatchesType(source, catchEntries);

  source.importLine(`import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";`);
  source.importLine(`import type { MatchHandlerReturnValue, Route } from "@typed/router";`);
  source.importTypeNamespace("Layer", "effect/Layer");
  source.importTypeNamespace("RouterTypes", "@typed/router");
  source.importTypeNamespace("RouteModule", moduleSpecifier);
  source.add(`type RouteExport = typeof RouteModule extends { readonly route: infer Rt } ? Rt : never;
type ExportValue<T, Name extends PropertyKey> = T extends { readonly [K in Name]: infer Value }
  ? Value
  : never;`);

  source.add(`export type Params = RouteExport extends Route.Any ? Route.Type<RouteExport> : never;

export type Dependencies = ${dependenciesType};

export type Guards = ${guardsType};

export type Layouts<A = any, E = any, R = any> = ${layoutsType};

export type Catches<A = any, E = any, R = any> = ${catchesType};

export type RouteTypes = {
  readonly params: Params;
  readonly dependencies: Dependencies;
  readonly guards: Guards;
  readonly layouts: Layouts;
  readonly catches: Catches;
};

export type Template<E = any, R = any> = (
  params: RefSubject<Params>,
) => MatchHandlerReturnValue<any, E, R>;

export type Handler<E = any, R = any> = Template<E, R>;`);

  return source.emit();
}

function routeConcernImports(
  api: TypeInfoApi,
  importer: string,
  concern: RouteConcern,
  aliasPrefix: string,
): readonly RouteConcernImport[] {
  const directoryImports = routeDirectoryConcernImports(api, importer, concern, aliasPrefix);
  const sibling = routeSiblingConcernImport(
    api,
    importer,
    concern,
    aliasPrefix,
    directoryImports.length,
  );
  return sibling ? [...directoryImports, sibling] : directoryImports;
}

function routeDirectoryConcernImports(
  api: TypeInfoApi,
  importer: string,
  concern: RouteConcern,
  aliasPrefix: string,
): readonly RouteConcernImport[] {
  const imports: RouteConcernImport[] = [];
  let current = dirname(importer);
  while (true) {
    const candidate = join(current, ROUTE_DIRECTORY_COMPANION_BY_CONCERN[concern]);
    if (existsSync(candidate)) {
      watchCompanion(api, importer, candidate);
      imports.push(routeConcernImport(importer, candidate, `${aliasPrefix}${imports.length}`));
    }

    const parent = dirname(current);
    if (parent === current) return imports;
    current = parent;
  }
}

function routeSiblingConcernImport(
  api: TypeInfoApi,
  importer: string,
  concern: RouteConcern,
  aliasPrefix: string,
  index: number,
): RouteConcernImport | undefined {
  const candidate = join(
    dirname(importer),
    `${basename(stripScriptExtension(importer))}${ROUTE_SIBLING_SUFFIX_BY_CONCERN[concern]}`,
  );
  if (!existsSync(candidate)) return undefined;
  watchCompanion(api, importer, candidate);
  return routeConcernImport(importer, candidate, `${aliasPrefix}${index}`);
}

function routeConcernImport(importer: string, target: string, alias: string): RouteConcernImport {
  return { alias, moduleSpecifier: moduleSpecifierFrom(dirname(importer), target), path: target };
}

function routeConcernTypeEntries(
  source: TypeModuleSource,
  concern: RouteConcern,
  imports: readonly RouteConcernImport[],
  exportNames: ReadonlySet<string>,
): readonly string[] {
  const hasInFile =
    concern === "catch"
      ? exportNames.has("catch") || exportNames.has("catchFn")
      : exportNames.has(concern);
  if (!hasInFile && imports.length === 0) return [];
  const inFile = routeInFileConcernType(source, concern, exportNames);
  const imported = imports.map(
    ({ alias }) => `${routeConcernValueType(source, concern)}<typeof ${alias}>`,
  );
  return inFile ? [inFile, ...imported] : imported;
}

function routeComposedConcernTypeEntries(
  source: TypeModuleSource,
  concern: Exclude<RouteConcern, "dependencies">,
  imports: readonly RouteConcernImport[],
  exportNames: ReadonlySet<string>,
): readonly string[] {
  const directoryImports = imports.filter(({ path }) => basename(path).startsWith("_")).reverse();
  const hasInFile =
    concern === "catch"
      ? exportNames.has("catch") || exportNames.has("catchFn")
      : exportNames.has(concern);
  const sibling = hasInFile
    ? undefined
    : imports.find(({ path }) => !basename(path).startsWith("_"));
  if (directoryImports.length === 0 && sibling === undefined && !hasInFile) return [];
  const valueType = routeConcernValueType(source, concern);
  const directoryEntries = directoryImports.map(({ alias }) => `${valueType}<typeof ${alias}>`);
  const inFile = routeInFileConcernType(source, concern, exportNames);
  const siblingEntry = sibling ? `${valueType}<typeof ${sibling.alias}>` : undefined;
  return [...directoryEntries, siblingEntry, inFile].filter(
    (value): value is string => value !== undefined,
  );
}

function routeComposedGuardsType(source: TypeModuleSource, entries: readonly string[]): string {
  if (entries.length === 0) return "never";
  source.add(`type GuardValues = ${typeTuple(entries)};`);
  return "RouterTypes.ComposeGuards<Params, GuardValues>";
}

function routeComposedLayoutsType(source: TypeModuleSource, entries: readonly string[]): string {
  if (entries.length === 0) return "never";
  source.add(`type LayoutValues = ${typeTuple(entries)};`);
  return "RouterTypes.ComposeLayouts<Params, A, E, R, LayoutValues>";
}

function routeComposedCatchesType(source: TypeModuleSource, entries: readonly string[]): string {
  if (entries.length === 0) return "never";
  source.add(`type CatchValues = ${typeTuple(entries)};`);
  return "RouterTypes.ComposeCatches<E, CatchValues>";
}

function routeInFileConcernType(
  source: TypeModuleSource,
  concern: RouteConcern,
  exportNames: ReadonlySet<string>,
): string | undefined {
  if (concern === "catch" && (exportNames.has("catch") || exportNames.has("catchFn"))) {
    return `${routeConcernValueType(source, concern)}<typeof RouteModule>`;
  }
  return exportNames.has(concern)
    ? `${routeConcernValueType(source, concern)}<typeof RouteModule>`
    : undefined;
}

function routeConcernValueType(source: TypeModuleSource, concern: RouteConcern): string {
  if (concern === "dependencies") {
    const helper = defaultOrExportHelper(source);
    return source.helper(
      "DependencyValue",
      `type DependencyValue<T> = ${helper}<T, "dependencies">;`,
    );
  }
  if (concern === "guard") {
    const helper = defaultOrExportHelper(source);
    return source.helper("GuardValue", `type GuardValue<T> = ${helper}<T, "guard">;`);
  }
  if (concern === "layout") {
    return source.helper("LayoutValue", `type LayoutValue<T> = ExportValue<T, "layout">;`);
  }
  return source.helper(
    "CatchValue",
    `type CatchValue<T> = [ExportValue<T, "catch">] extends [never]
  ? ExportValue<T, "catchFn">
  : ExportValue<T, "catch">;`,
  );
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

function routeModuleSpecifier(importer: string): string {
  return `./${basename(importer).replace(/\.[cm]?[tj]sx?$/, ".js")}`;
}

function moduleSpecifierFrom(fromDir: string, target: string): string {
  const relativePath = toPosixPath(relative(fromDir, target));
  const withDot = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  return withDot.replace(/\.[cm]?[tj]sx?$/, ".js");
}

function watchCompanion(api: TypeInfoApi, importer: string, target: string): void {
  const relativePath = toPosixPath(relative(dirname(importer), target));
  const withDot = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  api.file(withDot, { baseDir: dirname(importer), watch: true });
}
