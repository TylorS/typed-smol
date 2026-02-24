/**
 * File-role classification for HttpApi virtual module discovery.
 * Implements the supported file-role matrix: API root, group, endpoint primary, endpoint companions, directory companions.
 * Diagnostics-ready metadata for unsupported reserved names.
 */

import { toPosixPath } from "./path.js";

/** Script extensions that count as API source candidates (aligned with router plugin). */
export const HTTPAPI_SCRIPT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
] as const;

export const HTTPAPI_SCRIPT_EXTENSION_SET = new Set<string>(
  HTTPAPI_SCRIPT_EXTENSIONS.map((e) => e.toLowerCase()),
);

/** Directory companion filenames (exact match). */
export const HTTPAPI_DIRECTORY_COMPANION_FILES = [
  "_dependencies.ts",
  "_middlewares.ts",
  "_prefix.ts",
  "_openapi.ts",
] as const;

/** Endpoint companion suffixes (stem ends with these before extension). */
export const HTTPAPI_ENDPOINT_COMPANION_SUFFIXES = [
  ".name",
  ".dependencies",
  ".middlewares",
  ".prefix",
  ".openapi",
] as const;

export type HttpApiDirectoryCompanionKind =
  (typeof HTTPAPI_DIRECTORY_COMPANION_FILES)[number];
export type HttpApiEndpointCompanionKind =
  (typeof HTTPAPI_ENDPOINT_COMPANION_SUFFIXES)[number];

/** Role of a discovered file relative to the API root. */
export type HttpApiFileRole =
  | { readonly role: "api_root"; readonly path: string }
  | { readonly role: "group_override"; readonly path: string }
  | { readonly role: "endpoint_primary"; readonly path: string }
  | {
      readonly role: "endpoint_companion";
      readonly path: string;
      readonly kind: HttpApiEndpointCompanionKind;
      readonly endpointStem: string;
    }
  | {
      readonly role: "directory_companion";
      readonly path: string;
      readonly kind: HttpApiDirectoryCompanionKind;
    }
  | {
      readonly role: "unsupported_reserved";
      readonly path: string;
      readonly diagnosticCode: string;
      readonly diagnosticMessage: string;
    };

/** Diagnostic-ready metadata for classification issues (e.g. unsupported companion name). */
export type HttpApiFileRoleDiagnostic = {
  readonly code: string;
  readonly message: string;
  readonly path: string;
};

const DIRECTORY_COMPANION_SET = new Set<string>(
  HTTPAPI_DIRECTORY_COMPANION_FILES.map((f) => f.toLowerCase()),
);

/** Normalized path (posix) relative to API base; used for stable ordering. */
export function normalizeHttpApiRelativePath(relativePath: string): string {
  const posix = toPosixPath(relativePath);
  return posix.replace(/^\.\//, "").replace(/\/+/g, "/");
}

/**
 * Returns true if the file has a supported script extension for API discovery.
 */
export function isHttpApiScriptExtension(ext: string): boolean {
  return HTTPAPI_SCRIPT_EXTENSION_SET.has(ext.toLowerCase());
}

/**
 * Classifies a single file path (relative to API root, posix) into an HttpApi file role.
 * Does not read the filesystem; only interprets path and filename.
 * Returns diagnostic-ready metadata for unsupported reserved names.
 */
export function classifyHttpApiFileRole(relativePath: string): HttpApiFileRole {
  const path = normalizeHttpApiRelativePath(relativePath);
  const lastSlash = path.lastIndexOf("/");
  const dir = lastSlash < 0 ? "" : path.slice(0, lastSlash);
  const fileName = lastSlash < 0 ? path : path.slice(lastSlash + 1);
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".d.ts")) {
    return {
      role: "unsupported_reserved",
      path,
      diagnosticCode: "HTTPAPI-ROLE-001",
      diagnosticMessage: `declaration files are not API sources: ${fileName}`,
    };
  }

  const extIdx = fileName.lastIndexOf(".");
  if (extIdx <= 0) {
    return {
      role: "unsupported_reserved",
      path,
      diagnosticCode: "HTTPAPI-ROLE-002",
      diagnosticMessage: `filename must have a script extension: ${fileName}`,
    };
  }
  const ext = fileName.slice(extIdx);
  if (!isHttpApiScriptExtension(ext)) {
    return {
      role: "unsupported_reserved",
      path,
      diagnosticCode: "HTTPAPI-ROLE-003",
      diagnosticMessage: `unsupported extension for API source: ${fileName}`,
    };
  }

  const stem = fileName.slice(0, extIdx);

  if (stem === "_api" && dir === "") {
    return { role: "api_root", path };
  }
  if (stem === "_group") {
    return { role: "group_override", path };
  }
  if (DIRECTORY_COMPANION_SET.has(fileName)) {
    const kind = HTTPAPI_DIRECTORY_COMPANION_FILES.find(
      (k) => k.toLowerCase() === lower,
    )!;
    return { role: "directory_companion", path, kind };
  }
  if (stem === "_api" || stem === "_group") {
    return {
      role: "unsupported_reserved",
      path,
      diagnosticCode: "HTTPAPI-ROLE-004",
      diagnosticMessage: `convention file "${fileName}" must be at API root (_api.ts) or directory root (_group.ts)`,
    };
  }

  for (const suffix of HTTPAPI_ENDPOINT_COMPANION_SUFFIXES) {
    if (stem.endsWith(suffix)) {
      const endpointStem = stem.slice(0, -suffix.length);
      if (endpointStem === "") {
        return {
          role: "unsupported_reserved",
          path,
          diagnosticCode: "HTTPAPI-ROLE-005",
          diagnosticMessage: `endpoint companion must have a base name: ${fileName}`,
        };
      }
      return {
        role: "endpoint_companion",
        path,
        kind: suffix as HttpApiEndpointCompanionKind,
        endpointStem,
      };
    }
  }

  if (stem.startsWith("_")) {
    return {
      role: "unsupported_reserved",
      path,
      diagnosticCode: "HTTPAPI-ROLE-006",
      diagnosticMessage: `reserved underscore-prefixed filename not in supported matrix: ${fileName}`,
    };
  }

  return { role: "endpoint_primary", path };
}

/**
 * Stable sort key for discovered files: normalized relative path (posix).
 * Use with Array.sort(compareHttpApiPathOrder) for deterministic ordering.
 */
export function compareHttpApiPathOrder(a: string, b: string): number {
  const na = normalizeHttpApiRelativePath(a);
  const nb = normalizeHttpApiRelativePath(b);
  return na.localeCompare(nb, "en");
}

/**
 * Sorts an array of relative paths in deterministic API discovery order.
 */
export function sortHttpApiPaths(paths: readonly string[]): string[] {
  return [...paths].sort(compareHttpApiPathOrder);
}
