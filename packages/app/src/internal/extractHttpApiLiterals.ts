/**
 * Extract path and method from endpoint TypeInfo snapshot.
 * Uses TypeInfoApi export types instead of parsing source with TypeScript.
 * Handles literal, object, and reference (e.g. Route<P,S>) shapes; unknown kinds return null.
 */
import type {
  LiteralTypeNode,
  ObjectTypeNode,
  ReferenceTypeNode,
  TypeInfoApi,
  TypeInfoFileSnapshot,
  TypeNode,
} from "@typed/virtual-modules";

export interface ExtractedEndpointLiterals {
  readonly path: string;
  readonly method: string;
  readonly name: string;
}

function getLiteralText(node: TypeNode | undefined): string | null {
  if (!node || node.kind !== "literal") return null;
  return (node as LiteralTypeNode).text || null;
}

/** Extracts path string from Route-like type (literal, object.path, or Route reference). */
export function getPathFromRouteType(type: TypeNode): string | null {
  if (type.kind === "literal") {
    const raw = (type as LiteralTypeNode).text;
    return raw ? (raw.startsWith("/") ? raw : `/${raw}`) : null;
  }
  if (type.kind === "object") {
    const pathProp = (type as ObjectTypeNode).properties.find((p) => p.name === "path");
    if (!pathProp) return null;
    const raw = getLiteralText(pathProp.type);
    return raw ? (raw.startsWith("/") ? raw : `/${raw}`) : null;
  }
  if (type.kind === "reference") {
    const typeArgs = (type as ReferenceTypeNode).typeArguments;
    if (typeArgs?.length) return getPathFromRouteType(typeArgs[0]);
  }
  return null;
}

/**
 * Extracts route path and method from TypeInfo snapshot exports.
 * Reads from route and method exports; path from route type (literal or object.path).
 */
export function extractEndpointLiterals(
  snapshot: TypeInfoFileSnapshot,
  stem: string,
): ExtractedEndpointLiterals {
  let path = `/${stem}`;
  let method = "GET";

  const routeExport = snapshot.exports.find((e) => e.name === "route");
  if (routeExport) {
    const p = getPathFromRouteType(routeExport.type);
    if (p) path = p;
  }

  const methodExport = snapshot.exports.find((e) => e.name === "method");
  if (methodExport) {
    const m = getLiteralText(methodExport.type);
    if (m) method = m.toUpperCase();
  }

  return { path, method, name: stem };
}

export type ExtractPrefixFromConventionResult =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Extracts prefix path from convention file (_api.ts, _group.ts, _prefix.ts, .prefix.ts).
 * Export must be assignable to Route from @typed/router.
 */
export function extractPrefixFromConvention(
  snapshot: TypeInfoFileSnapshot,
  api: TypeInfoApi,
  exportName: "prefix" | "default",
): ExtractPrefixFromConventionResult {
  const exp = snapshot.exports.find((e) => e.name === exportName);
  if (!exp) return { ok: true, path: "" };
  if (!api.isAssignableTo(exp.type, "Route")) {
    return {
      ok: false,
      reason: `prefix export must be Route from @typed/router in ${snapshot.filePath}`,
    };
  }
  const path = getPathFromRouteType(exp.type);
  if (!path) {
    return {
      ok: false,
      reason: `could not extract path from Route in ${snapshot.filePath}`,
    };
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { ok: true, path: normalized };
}
