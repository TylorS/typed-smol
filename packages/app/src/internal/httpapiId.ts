/**
 * Parse and resolve `api:` virtual module IDs (router-plugin semantics).
 * Used by HttpApi virtual module plugin for target-directory resolution.
 */

import { dirname } from "node:path";
import { pathIsUnderBase, resolvePathUnderBase, toPosixPath } from "./path.js";
import { validateNonEmptyString, validatePathSegment } from "./validation.js";

export const HTTPAPI_VIRTUAL_MODULE_PREFIX = "api:";

export type ParseHttpApiVirtualModuleIdResult =
  | { readonly ok: true; readonly relativeDirectory: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Parses an `api:./<directory>` (or `api:<directory>`) ID.
 * Normalizes bare directory to `./<directory>`.
 */
export function parseHttpApiVirtualModuleId(
  id: string,
  prefix: string = HTTPAPI_VIRTUAL_MODULE_PREFIX,
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

/**
 * Resolves the target directory for an `api:` ID relative to the importer.
 * Rejects paths that escape the importer base directory.
 */
export function resolveHttpApiTargetDirectory(
  id: string,
  importer: string,
  prefix: string = HTTPAPI_VIRTUAL_MODULE_PREFIX,
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
