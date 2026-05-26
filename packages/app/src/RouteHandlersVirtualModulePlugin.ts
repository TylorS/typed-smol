import { statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import type {
  TypeInfoFileSnapshot,
  VirtualModuleBuildContext,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  stripScriptExtension,
  toPosixPath,
} from "./internal/path.js";
import { makeUniqueVarNames, pathToIdentifier } from "./internal/routeIdentifiers.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";

const DEFAULT_PREFIX = "route-handlers:";
const DEFAULT_PLUGIN_NAME = "route-handlers-virtual-module";
const ROUTE_HANDLER_GLOBS = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mts",
  "**/*.cts",
  "**/*.mjs",
  "**/*.cjs",
];
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

export interface RouteHandlersVirtualModulePluginOptions {
  readonly prefix?: string;
  readonly name?: string;
}

export type ParseRouteHandlersVirtualModuleIdResult =
  | { readonly ok: true; readonly relativeDirectory: string }
  | { readonly ok: false; readonly reason: string };

export function parseRouteHandlersVirtualModuleId(
  id: string,
  prefix: string = DEFAULT_PREFIX,
): ParseRouteHandlersVirtualModuleIdResult {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) return { ok: false, reason: idResult.reason };
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok) return { ok: false, reason: prefixResult.reason };
  if (!id.startsWith(prefix)) return { ok: false, reason: `id must start with "${prefix}"` };

  const body = id.slice(prefix.length);
  const separatorIndex = body.indexOf("?");
  const rawRelativeDirectory = separatorIndex === -1 ? body : body.slice(0, separatorIndex);
  const params = new URLSearchParams(separatorIndex === -1 ? "" : body.slice(separatorIndex + 1));
  const unsupported = [...params.keys()][0];
  if (unsupported !== undefined) {
    return {
      ok: false,
      reason: `route-handlers virtual module does not support query option "${unsupported}"`,
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

export type ResolveRouteHandlersTargetDirectoryResult =
  | { readonly ok: true; readonly targetDirectory: string }
  | { readonly ok: false; readonly reason: string };

export function resolveRouteHandlersTargetDirectory(
  id: string,
  importer: string,
  prefix: string = DEFAULT_PREFIX,
): ResolveRouteHandlersTargetDirectoryResult {
  const parsed = parseRouteHandlersVirtualModuleId(id, prefix);
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

export function createRouteHandlersVirtualModulePlugin(
  options: RouteHandlersVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id, importer) {
      const resolved = resolveRouteHandlersTargetDirectory(id, importer, prefix);
      return resolved.ok && isExistingDirectory(resolved.targetDirectory);
    },
    build(id, importer, api, context) {
      const resolved = resolveRouteHandlersTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return { errors: [{ code: "RHVM-ID-001", message: resolved.reason, pluginName: name }] };
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return {
          errors: [
            {
              code: "RHVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath(dirname(importer), resolved.targetDirectory)}`,
              pluginName: name,
            },
          ],
        } satisfies VirtualModuleBuildError;
      }
      if (!shouldEmitRouteHandlersDefault(context)) return "export {};";
      return emitRouteHandlersSource(
        api.directory(ROUTE_HANDLER_GLOBS, {
          baseDir: resolved.targetDirectory,
          recursive: true,
          watch: true,
        }),
        resolved.targetDirectory,
        importer,
      );
    },
  };
}

function shouldEmitRouteHandlersDefault(context: VirtualModuleBuildContext | undefined): boolean {
  if (!context || context.requestedExports.kind === "all") return true;
  return (
    context.requestedExports.names.has("default") ||
    context.requestedExports.typeOnlyNames.has("default")
  );
}

function isExistingDirectory(absolutePath: string): boolean {
  try {
    return statSync(absolutePath).isDirectory();
  } catch {
    return false;
  }
}

function emitRouteHandlersSource(
  snapshots: readonly TypeInfoFileSnapshot[],
  targetDirectory: string,
  importer: string,
): string {
  const handlerPaths = snapshots
    .map((snapshot) => toPosixPath(relative(targetDirectory, snapshot.filePath)))
    .filter(isHandlerPath)
    .sort();
  const dependencyPaths = snapshots
    .map((snapshot) => toPosixPath(relative(targetDirectory, snapshot.filePath)))
    .filter(isHandlerDependencyPath)
    .sort();
  const importerDir = dirname(toPosixPath(importer));
  const nameEntries = [
    ...handlerPaths.flatMap((handlerPath) => [
      {
        path: routePathForHandler(handlerPath),
        proposedName: pathToIdentifier(routePathForHandler(handlerPath)),
      },
      { path: handlerPath, proposedName: pathToIdentifier(handlerPath) },
    ]),
    ...dependencyPaths.map((path) => ({ path, proposedName: pathToIdentifier(path) })),
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);
  const imports = [
    `import * as RouteHandlers from "@typed/app/RouteHandlers";`,
    ...handlerPaths.flatMap((handlerPath) => {
      const routePath = routePathForHandler(handlerPath);
      return [
        `import * as ${varNameByPath.get(routePath)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, routePath))};`,
        `import * as ${varNameByPath.get(handlerPath)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, handlerPath))};`,
      ];
    }),
    ...dependencyPaths.map(
      (path) =>
        `import * as ${varNameByPath.get(path)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, path))};`,
    ),
  ];
  const matchedExpression = handlerPaths.reduce((current, handlerPath) => {
    const routePath = routePathForHandler(handlerPath);
    const routeName = varNameByPath.get(routePath);
    const handlerName = varNameByPath.get(handlerPath);
    return `${current}.match(${routeName}.route, ${handlerName}.handler)`;
  }, "RouteHandlers.empty");
  const expression = dependencyPaths.reduce((current, dependencyPath) => {
    const dependencyName = varNameByPath.get(dependencyPath);
    return `${current}.provide(RouteHandlers.normalizeDependencyInput(${dependencyName}.default))`;
  }, matchedExpression);

  return `${imports.join("\n")}

const handlers = ${expression};
export default handlers;
`;
}

function isHandlerPath(path: string): boolean {
  return (
    SCRIPT_EXTENSION_SET.has(extname(path).toLowerCase()) &&
    /\.handler\.(?:[cm]?[tj]sx?)$/.test(path)
  );
}

function isHandlerDependencyPath(path: string): boolean {
  return basename(path) === "_handlers.dependencies.ts";
}

function routePathForHandler(handlerPath: string): string {
  return toPosixPath(handlerPath.replace(/\.handler(\.[^.]+)$/, "$1"));
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
