import { readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import {
  buildRouteDescriptors,
  type RouteContractViolation,
} from "./internal/buildRouteDescriptors.js";
import { emitRouterMatchSource } from "./internal/emitRouterSource.js";
import {
  pathIsUnderBase,
  resolvePathUnderBase,
  resolveRelativePath,
  toPosixPath,
} from "./internal/path.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { ROUTER_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const DEFAULT_PREFIX = "router:";
const DEFAULT_PLUGIN_NAME = "router-virtual-module";

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
  /** When true, treat unknown _dependencies.ts default export types as "array" instead of failing. Use for preview/IDE when type targets may not resolve (e.g. VS Code extension). */
  readonly lenientDepsValidation?: boolean;
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

  let relativeDirectory = id.slice(prefix.length);
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
  const lenientDepsValidation = options.lenientDepsValidation ?? false;

  return {
    name,
    typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS,
    shouldResolve(id, importer) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) return false;
      if (!isExistingDirectory(resolved.targetDirectory)) return false;
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
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
      } = buildRouteDescriptors(snapshots, resolved.targetDirectory, api, {
        lenientDepsValidation,
      });

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
