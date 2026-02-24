/**
 * OpenAPI config mapper for HttpApi virtual module plugin.
 * Maps convention/option layers to Effect-backed surfaces:
 * - OpenApi.annotations keys
 * - OpenApi.fromApi additionalProperties (API scope only)
 * - Exposure: jsonPath, swaggerPath, scalar (json/swagger/scalar modes)
 * Scope validation and route-conflict diagnostics are applied.
 */

/** Supported OpenApi.annotation keys (Effect-backed). */
export const OPENAPI_ANNOTATION_KEYS = [
  "identifier",
  "title",
  "version",
  "description",
  "license",
  "summary",
  "deprecated",
  "externalDocs",
  "servers",
  "format",
  "override",
  "exclude",
  "transform",
] as const;

export type OpenApiAnnotationKey = (typeof OPENAPI_ANNOTATION_KEYS)[number];

export const OPENAPI_ANNOTATION_KEY_SET = new Set<string>(OPENAPI_ANNOTATION_KEYS);

/** Scope at which OpenAPI config is applied. */
export type OpenApiConfigScope = "api" | "group" | "endpoint";

/** Annotation-only config (allowed at api, group, endpoint). */
export interface OpenApiAnnotationsConfig {
  readonly [key: string]: unknown;
}

/** Spec generation options (API scope only). */
export interface OpenApiGenerationConfig {
  readonly additionalProperties?: boolean | Record<string, unknown>;
}

/** Scalar exposure config. */
export interface OpenApiScalarExposureConfig {
  readonly path?: `/${string}`;
  readonly source?: "inline" | "cdn";
  readonly version?: string;
  readonly config?: Record<string, unknown>;
}

/** Exposure routes (API scope only). */
export interface OpenApiExposureConfig {
  readonly jsonPath?: `/${string}` | false;
  readonly swaggerPath?: `/${string}` | false;
  readonly scalar?: OpenApiScalarExposureConfig | false;
}

/** Normalized OpenAPI config after scope validation. */
export interface NormalizedOpenApiConfig {
  readonly annotations: OpenApiAnnotationsConfig;
  readonly generation: OpenApiGenerationConfig;
  readonly exposure: OpenApiExposureConfig;
}

/** Diagnostic for OpenAPI config validation. */
export interface OpenApiConfigDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly scope?: OpenApiConfigScope;
}

const DIAG_SCOPE_GENERATION = "AVM-OPENAPI-001";
const DIAG_SCOPE_EXPOSURE = "AVM-OPENAPI-002";
const DIAG_ROUTE_CONFLICT = "AVM-OPENAPI-003";
const DIAG_INVALID_ANNOTATION_KEY = "AVM-OPENAPI-004";

/**
 * Validates that generation options (e.g. additionalProperties) are only at API scope.
 */
export function validateOpenApiGenerationScope(
  scope: OpenApiConfigScope,
  generation: OpenApiGenerationConfig,
): OpenApiConfigDiagnostic[] {
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  if (scope === "api") return diagnostics;
  const hasGen =
    generation.additionalProperties !== undefined &&
    (typeof generation.additionalProperties === "boolean" ||
      (typeof generation.additionalProperties === "object" && generation.additionalProperties !== null));
  if (hasGen) {
    diagnostics.push({
      code: DIAG_SCOPE_GENERATION,
      message: "OpenAPI generation options (e.g. additionalProperties) are allowed at API scope only.",
      scope,
    });
  }
  return diagnostics;
}

/**
 * Validates that exposure options (jsonPath, swaggerPath, scalar) are only at API scope.
 */
export function validateOpenApiExposureScope(
  scope: OpenApiConfigScope,
  exposure: OpenApiExposureConfig,
): OpenApiConfigDiagnostic[] {
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  if (scope === "api") return diagnostics;
  const hasExposure =
    exposure.jsonPath !== undefined ||
    exposure.swaggerPath !== undefined ||
    exposure.scalar !== undefined;
  if (hasExposure) {
    diagnostics.push({
      code: DIAG_SCOPE_EXPOSURE,
      message: "OpenAPI exposure options (jsonPath, swaggerPath, scalar) are allowed at API scope only.",
      scope,
    });
  }
  return diagnostics;
}

/**
 * Collects exposure route paths and detects conflicts (same path, different mode).
 */
export interface ExposureRouteEntry {
  readonly path: string;
  readonly mode: "json" | "swagger" | "scalar";
}

export function collectExposureRoutes(exposure: OpenApiExposureConfig): ExposureRouteEntry[] {
  const entries: ExposureRouteEntry[] = [];
  if (exposure.jsonPath && typeof exposure.jsonPath === "string") {
    entries.push({ path: exposure.jsonPath, mode: "json" });
  }
  if (exposure.swaggerPath && typeof exposure.swaggerPath === "string") {
    entries.push({ path: exposure.swaggerPath, mode: "swagger" });
  }
  if (exposure.scalar && typeof exposure.scalar === "object" && exposure.scalar.path) {
    entries.push({ path: exposure.scalar.path, mode: "scalar" });
  }
  return entries;
}

/**
 * Detects route conflicts: same path used for more than one exposure mode.
 */
export function validateOpenApiExposureRouteConflicts(
  exposure: OpenApiExposureConfig,
): OpenApiConfigDiagnostic[] {
  const routes = collectExposureRoutes(exposure);
  const byPath = new Map<string, string[]>();
  for (const { path, mode } of routes) {
    const normalized = path.toLowerCase().replace(/\/+$/, "") || "/";
    const list = byPath.get(normalized) ?? [];
    list.push(mode);
    byPath.set(normalized, list);
  }
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  for (const [path, modes] of byPath) {
    if (modes.length > 1) {
      diagnostics.push({
        code: DIAG_ROUTE_CONFLICT,
        message: `OpenAPI exposure route conflict: path "${path}" used for multiple modes: ${[...new Set(modes)].join(", ")}`,
      });
    }
  }
  return diagnostics;
}

/**
 * Filters raw annotation keys to Effect-supported set; emits diagnostic for unsupported keys.
 */
export function filterAnnotationKeys(
  raw: Record<string, unknown>,
): { annotations: OpenApiAnnotationsConfig; diagnostics: OpenApiConfigDiagnostic[] } {
  const annotations: OpenApiAnnotationsConfig = {};
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (OPENAPI_ANNOTATION_KEY_SET.has(key)) {
      (annotations as Record<string, unknown>)[key] = value;
    } else {
      diagnostics.push({
        code: DIAG_INVALID_ANNOTATION_KEY,
        message: `Unsupported OpenAPI annotation key: "${key}". Supported: ${OPENAPI_ANNOTATION_KEYS.join(", ")}`,
      });
    }
  }
  return { annotations, diagnostics };
}

/**
 * Normalizes and validates OpenAPI config for API scope.
 * Merges annotations, validates generation/exposure scope and route conflicts.
 */
export function normalizeOpenApiConfig(
  scope: OpenApiConfigScope,
  raw: {
    annotations?: Record<string, unknown>;
    generation?: OpenApiGenerationConfig;
    exposure?: OpenApiExposureConfig;
  },
): { config: NormalizedOpenApiConfig; diagnostics: OpenApiConfigDiagnostic[] } {
  const diagnostics: OpenApiConfigDiagnostic[] = [];

  const { annotations: ann, diagnostics: annDiag } = filterAnnotationKeys(
    (raw.annotations ?? {}) as Record<string, unknown>,
  );
  diagnostics.push(...annDiag);

  const generation = raw.generation ?? {};
  diagnostics.push(...validateOpenApiGenerationScope(scope, generation));

  const exposure = raw.exposure ?? {};
  diagnostics.push(...validateOpenApiExposureScope(scope, exposure));
  if (scope === "api") {
    diagnostics.push(...validateOpenApiExposureRouteConflicts(exposure));
  }

  const config: NormalizedOpenApiConfig = {
    annotations: ann,
    generation,
    exposure,
  };

  return { config, diagnostics };
}
