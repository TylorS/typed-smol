/**
 * Extract path and method from endpoint TypeInfo snapshot.
 * Uses TypeInfoApi export types instead of parsing source with TypeScript.
 */
import type { LiteralTypeNode, TypeInfoFileSnapshot, TypeNode } from "@typed/virtual-modules";

export interface ExtractedEndpointLiterals {
  readonly path: string;
  readonly method: string;
  readonly name: string;
}

function getLiteralText(node: TypeNode | undefined): string | null {
  if (!node || node.kind !== "literal") return null;
  return (node as LiteralTypeNode).text || null;
}

function getPathFromRouteType(type: TypeNode): string | null {
  if (type.kind === "literal") {
    const raw = type.text;
    return raw ? (raw.startsWith("/") ? raw : `/${raw}`) : null;
  }
  if (type.kind === "object") {
    const pathProp = type.properties.find((p) => p.name === "path");
    if (!pathProp) return null;
    const raw = getLiteralText(pathProp.type);
    return raw ? (raw.startsWith("/") ? raw : `/${raw}`) : null;
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
