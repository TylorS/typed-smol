import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { posix } from "node:path";
import type { WatchDependencyDescriptor } from "../types.js";

/** Base directory for virtual files under node_modules (enables go-to-definition to resolve correctly). */
export const VIRTUAL_NODE_MODULES_RELATIVE = "node_modules/.typed/virtual";

export const toPosixPath = (path: string): string => path.replaceAll("\\", "/");

export const resolveRelativePath = (baseDir: string, relativePath: string): string =>
  toPosixPath(resolve(baseDir, relativePath));

/**
 * Resolves relativePath against baseDir and ensures the result stays under baseDir.
 * Use for plugin/caller-controlled paths to prevent path traversal.
 */
export function resolvePathUnderBase(
  baseDir: string,
  relativePath: string,
): { ok: true; path: string } | { ok: false; error: "path-escapes-base" } {
  const baseAbs = resolve(baseDir);
  const resolved = resolve(baseDir, relativePath);
  const rel = relative(baseAbs, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, error: "path-escapes-base" };
  }
  return { ok: true, path: toPosixPath(resolved) };
}

/** Returns true if absolutePath is under baseDir (or equal). Canonicalizes with realpath so symlinks (e.g. /tmp) match. */
export function pathIsUnderBase(baseDir: string, absolutePath: string): boolean {
  let baseAbs: string;
  let resolvedAbs: string;
  try {
    baseAbs = realpathSync(resolve(baseDir));
    resolvedAbs = realpathSync(resolve(absolutePath));
  } catch {
    baseAbs = resolve(baseDir);
    resolvedAbs = resolve(absolutePath);
  }
  const rel = relative(baseAbs, resolvedAbs);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false;
  }
  return true;
}

export const stableHash = (input: string): string =>
  createHash("sha1").update(input).digest("hex").slice(0, 16);

const sanitizeSegment = (value: string): string => value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");

/** URI scheme for virtual module identifiers (e.g. `typed-virtual://0/...`). Single source of truth for all consumers. */
export const VIRTUAL_MODULE_URI_SCHEME = "typed-virtual" as const;

export const createVirtualKey = (id: string, importer: string): string => `${importer}::${id}`;

export interface CreateVirtualFileNameParams {
  readonly id: string;
  readonly importer: string;
}

export interface CreateVirtualFileNameOptions {
  /** When provided, virtual files use projectRoot/node_modules/.typed/virtual/ so go-to-definition resolves correctly. */
  readonly projectRoot?: string;
}

/**
 * Virtual file name for the TS program. When projectRoot is provided, uses
 * node_modules/.typed/virtual/ so the path exists on disk (after materialization)
 * and go-to-definition works like node_modules packages. Falls back to
 * importer-adjacent path or typed-virtual:// URI when projectRoot is not set.
 */
export const createVirtualFileName = (
  pluginName: string,
  virtualKey: string,
  params?: CreateVirtualFileNameParams,
  options?: CreateVirtualFileNameOptions,
): string => {
  const safePluginName = sanitizeSegment(pluginName);
  const hash = stableHash(virtualKey);
  const basename = `__virtual_${safePluginName}_${hash}.ts`;
  if (params) {
    const projectRoot = options?.projectRoot;
    if (typeof projectRoot === "string" && projectRoot.trim().length > 0) {
      return toPosixPath(join(resolve(projectRoot), VIRTUAL_NODE_MODULES_RELATIVE, basename));
    }
    const importerDir = dirname(toPosixPath(params.importer));
    return `${importerDir}/${basename}`;
  }
  return `${VIRTUAL_MODULE_URI_SCHEME}://0/${safePluginName}/${hash}.ts`;
};

export const createWatchDescriptorKey = (descriptor: WatchDependencyDescriptor): string => {
  if (descriptor.type === "file") {
    return `file:${toPosixPath(descriptor.path)}`;
  }

  const globs = [...descriptor.relativeGlobs].sort().join("|");
  return `glob:${toPosixPath(descriptor.baseDir)}:${descriptor.recursive ? "r" : "nr"}:${globs}`;
};

export const dedupeSorted = (values: readonly string[]): readonly string[] =>
  [...new Set(values.map(toPosixPath))].sort();
