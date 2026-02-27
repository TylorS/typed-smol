/**
 * Extract OpenAPI exposure config from _api.ts openapi export.
 * Walks the type to extract jsonPath, swaggerPath, scalar.path as string literals.
 */
import type {
  LiteralTypeNode,
  ObjectTypeNode,
  TypeInfoFileSnapshot,
  TypeNode,
} from "@typed/virtual-modules";
import type { OpenApiExposureConfig, OpenApiScalarExposureConfig } from "./httpapiOpenApiConfig.js";

/** Strips surrounding double quotes from TypeScript literal text (e.g. '"/api"' -> '/api'). */
function stripSurroundingQuotes(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

function getLiteralString(node: TypeNode | undefined): string | null {
  if (!node || node.kind !== "literal") return null;
  const text = (node as LiteralTypeNode).text;
  const raw = typeof text === "string" ? text : null;
  return raw ? stripSurroundingQuotes(raw) : null;
}

function getProperty(type: TypeNode, name: string): TypeNode | undefined {
  if (type.kind === "object") {
    const prop = (type as ObjectTypeNode).properties.find((p) => p.name === name);
    return prop?.type;
  }
  if (type.kind === "intersection") {
    for (const el of (type as { elements: readonly TypeNode[] }).elements) {
      const found = getProperty(el, name);
      if (found) return found;
    }
  }
  return undefined;
}

function getObjectFromNode(node: TypeNode): ObjectTypeNode | undefined {
  if (node.kind === "object") return node as ObjectTypeNode;
  if (node.kind === "intersection") {
    for (const el of (node as { elements: readonly TypeNode[] }).elements) {
      const obj = getObjectFromNode(el);
      if (obj) return obj;
    }
  }
  return undefined;
}

/**
 * Extracts OpenAPI exposure config from the `openapi` export.
 * Returns null if the export is absent or extraction fails.
 */
export function extractOpenApiExposureConfig(
  snapshot: TypeInfoFileSnapshot,
): OpenApiExposureConfig | null {
  const openapiExport = snapshot.exports.find((e) => e.name === "openapi");
  if (!openapiExport) return null;

  const openapiType = openapiExport.type;
  const exposureObj = getProperty(openapiType, "exposure");
  if (!exposureObj) return null;

  const obj = getObjectFromNode(exposureObj);
  if (!obj) return null;

  let jsonPath: `/${string}` | undefined;
  let swaggerPath: `/${string}` | undefined;
  let scalar: OpenApiScalarExposureConfig | undefined;

  const jsonPathVal = getProperty(exposureObj, "jsonPath");
  if (jsonPathVal) {
    const literal = getLiteralString(jsonPathVal);
    if (literal !== null && literal.startsWith("/")) {
      jsonPath = literal as `/${string}`;
    }
  }

  const swaggerPathVal = getProperty(exposureObj, "swaggerPath");
  if (swaggerPathVal) {
    const literal = getLiteralString(swaggerPathVal);
    if (literal !== null && literal.startsWith("/")) {
      swaggerPath = literal as `/${string}`;
    }
  }

  const scalarVal = getProperty(exposureObj, "scalar");
  if (scalarVal && scalarVal.kind === "object") {
    const pathVal = getProperty(scalarVal, "path");
    const pathLiteral = pathVal ? getLiteralString(pathVal) : null;
    if (pathLiteral !== null && pathLiteral.startsWith("/")) {
      scalar = { path: pathLiteral as `/${string}` };
    }
  }

  if (!jsonPath && !swaggerPath && !scalar) return null;
  return {
    ...(jsonPath && { jsonPath }),
    ...(swaggerPath && { swaggerPath }),
    ...(scalar && { scalar }),
  } as OpenApiExposureConfig;
}
