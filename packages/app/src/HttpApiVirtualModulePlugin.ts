import { readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
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
import { emitHttpApiSource } from "./internal/emitHttpApiSource.js";
import { extractEndpointLiterals } from "./internal/extractHttpApiLiterals.js";
import {
  getCallableReturnType,
  isCallableNode,
  typeNodeIsRouteCompatible,
} from "./internal/routeTypeNode.js";
import { validateNonEmptyString, validatePathSegment } from "./internal/validation.js";
import type {
  TypeInfoApi,
  TypeInfoFileSnapshot,
  VirtualModuleBuildError,
  VirtualModulePlugin,
} from "@typed/virtual-modules";
import { HTTPAPI_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

const DEFAULT_PREFIX = "api:";
const DEFAULT_PLUGIN_NAME = "httpapi-virtual-module";

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
}

export type ParseHttpApiVirtualModuleIdResult =
  | { readonly ok: true; readonly relativeDirectory: string }
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

export type ResolveHttpApiTargetDirectoryResult =
  | { readonly ok: true; readonly targetDirectory: string }
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
      const resolved = resolveHttpApiTargetDirectory(id, importer, prefix);
      if (!resolved.ok) return false;
      if (!isExistingDirectory(resolved.targetDirectory)) return false;
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
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

      const snapshotsByRelativePath = mapSnapshotsByRelativePath(snapshots, resolved.targetDirectory);
      const relativePaths = [...snapshotsByRelativePath.keys()].sort((a, b) => a.localeCompare(b, "en"));
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

      const contractViolations = validateEndpointContracts(
        endpoints,
        snapshotsByRelativePath,
        api,
      );
      if (contractViolations.length > 0) {
        return {
          errors: contractViolations.map((violation) => ({
            code: violation.code,
            message: violation.message,
            pluginName: name,
          })),
        } satisfies VirtualModuleBuildError;
      }

      const extractedLiteralsByPath = new Map<string, { path: string; method: string; name: string }>();
      const optionalExportsByPath = new Map<string, ReadonlySet<"headers" | "body" | "success" | "error">>();
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
