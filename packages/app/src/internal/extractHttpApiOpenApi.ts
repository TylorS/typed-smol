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
import type {
  OpenApiAnnotationsConfig,
  OpenApiExposureConfig,
  OpenApiScalarExposureConfig,
} from "./httpapiOpenApiConfig.js";

export type ExtractedOpenApiConfig = {
  readonly annotations?: OpenApiAnnotationsConfig;
  readonly exposure?: OpenApiExposureConfig;
};

/** Match TypeInfo literal text with optional surrounding quotes (same as extractHttpApiLiterals). */
function normalizeTypeInfoLiteralText(text: string): string {
  const t = text.trim();
  if (t.length < 2) return t;
  const open = t[0];
  const close = t[t.length - 1];
  if ((open === '"' || open === "'") && close === open) {
    return t.slice(1, -1);
  }
  return t;
}

function getLiteralString(node: TypeNode | undefined): string | null {
  if (!node || node.kind !== "literal") return null;
  const text = (node as LiteralTypeNode).text;
  if (typeof text !== "string" || text === "") return null;
  return normalizeTypeInfoLiteralText(text);
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

function getLiteralValue(node: TypeNode | undefined): unknown {
  if (!node) return undefined;
  if (node.text === "true") return true;
  if (node.text === "false") return false;
  const literal = getLiteralString(node);
  if (literal !== null) return literal;
  const numeric = Number(node.text);
  return Number.isFinite(numeric) && node.text.trim() !== "" ? numeric : undefined;
}

function getObjectValue(node: TypeNode | undefined): Record<string, unknown> | undefined {
  if (!node) return undefined;
  const obj = getObjectFromNode(node);
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const property of obj.properties) {
    const value =
      property.type.kind === "object" ? getObjectValue(property.type) : getLiteralValue(property.type);
    if (value !== undefined) out[property.name] = value;
  }
  return out;
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
  return extractOpenApiConfig(snapshot)?.exposure ?? null;
}

export function extractOpenApiConfig(snapshot: TypeInfoFileSnapshot): ExtractedOpenApiConfig | null {
  const openapiExport = snapshot.exports.find((e) => e.name === "openapi");
  if (!openapiExport) return null;

  const openapiType = openapiExport.type;
  const annotations = getObjectValue(getProperty(openapiType, "annotations"));
  const exposureObj = getProperty(openapiType, "exposure");
  const exposure = exposureObj ? extractExposureConfig(exposureObj) : undefined;

  if (!annotations && !exposure) return null;
  return {
    ...(annotations && { annotations }),
    ...(exposure && { exposure }),
  };
}

function extractExposureConfig(exposureObj: TypeNode): OpenApiExposureConfig | undefined {
  if (!getObjectFromNode(exposureObj)) return undefined;

  const jsonPath = getPathProperty(exposureObj, "jsonPath");
  const swaggerPath = getPathProperty(exposureObj, "swaggerPath");
  const scalar = extractScalarConfig(getProperty(exposureObj, "scalar"));

  if (!jsonPath && !swaggerPath && !scalar) return undefined;
  return {
    ...(jsonPath && { jsonPath }),
    ...(swaggerPath && { swaggerPath }),
    ...(scalar && { scalar }),
  } as OpenApiExposureConfig;
}

function getPathProperty(node: TypeNode, name: string): `/${string}` | undefined {
  const value = getProperty(node, name);
  const literal = value ? getLiteralString(value) : null;
  return literal !== null && literal.startsWith("/") ? (literal as `/${string}`) : undefined;
}

function extractScalarConfig(node: TypeNode | undefined): OpenApiScalarExposureConfig | undefined {
  if (!node || node.kind !== "object") return undefined;
  const pathVal = getProperty(node, "path");
  const pathLiteral = pathVal ? getLiteralString(pathVal) : null;
  if (pathLiteral === null || !pathLiteral.startsWith("/")) return undefined;

  const source = getLiteralString(getProperty(node, "source"));
  const version = getLiteralString(getProperty(node, "version"));
  const config = getObjectValue(getProperty(node, "config"));
  return {
    path: pathLiteral as `/${string}`,
    ...(source === "cdn" || source === "inline" ? { source } : {}),
    ...(version ? { version } : {}),
    ...(config ? { config } : {}),
  };
}
