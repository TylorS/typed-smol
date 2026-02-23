import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { posix } from "node:path";
import type { WatchDependencyDescriptor } from "../types.js";

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

/**
 * Virtual file name for the TS program. Places the virtual file adjacent to the
 * importer so that relative imports and node_modules resolution within the
 * generated code work correctly. Falls back to a typed-virtual:// URI when
 * importer is not provided.
 */
export const createVirtualFileName = (
  pluginName: string,
  virtualKey: string,
  params?: CreateVirtualFileNameParams,
): string => {
  const safePluginName = sanitizeSegment(pluginName);
  const hash = stableHash(virtualKey);
  if (params) {
    const importerDir = dirname(toPosixPath(params.importer));
    return `${importerDir}/__virtual_${safePluginName}_${hash}.ts`;
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
