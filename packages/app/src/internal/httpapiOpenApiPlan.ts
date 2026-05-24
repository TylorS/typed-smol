import type { TypeInfoFileSnapshot } from "@typed/virtual-modules";
import {
  extractDefaultOpenApiConfig,
  extractOpenApiConfig,
  type ExtractedOpenApiConfig,
} from "./extractHttpApiOpenApi.js";
import type {
  DirectoryConventionRef,
  HttpApiDescriptorTree,
  HttpApiEndpointNode,
  HttpApiTreeNode,
} from "./httpapiDescriptorTree.js";
import {
  normalizeOpenApiConfig,
  type OpenApiAnnotationsConfig,
  type OpenApiConfigDiagnostic,
  type OpenApiExposureConfig,
  type OpenApiGenerationConfig,
} from "./httpapiOpenApiConfig.js";

export interface HttpApiOpenApiPlan {
  readonly api: {
    readonly annotations: OpenApiAnnotationsConfig;
    readonly generation: OpenApiGenerationConfig;
    readonly exposure: OpenApiExposureConfig;
  };
  readonly groupAnnotationsByPath: ReadonlyMap<string, OpenApiAnnotationsConfig>;
  readonly endpointAnnotationsByPath: ReadonlyMap<string, OpenApiAnnotationsConfig>;
  readonly diagnostics: readonly OpenApiConfigDiagnostic[];
}

export interface HttpApiOpenApiDefaults {
  readonly annotations?: Record<string, unknown>;
  readonly generation?: OpenApiGenerationConfig;
  readonly exposure?: OpenApiExposureConfig;
}

export function buildHttpApiOpenApiPlan(input: {
  readonly tree: HttpApiDescriptorTree;
  readonly snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>;
  readonly defaults?: HttpApiOpenApiDefaults;
}): HttpApiOpenApiPlan {
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  const apiRoot = input.tree.conventions.find((convention) => convention.kind === "api_root");
  const apiRootSnapshot = apiRoot ? input.snapshotsByRelativePath.get(apiRoot.path) : undefined;
  const extracted = apiRootSnapshot ? extractOpenApiConfig(apiRootSnapshot) : null;
  const rawConfig = mergeOpenApiConfig(input.defaults, extracted ?? undefined);
  const normalized = normalizeOpenApiConfig("api", {
    annotations: rawConfig.annotations,
    generation: rawConfig.generation,
    exposure: rawConfig.exposure,
  });
  diagnostics.push(...normalized.diagnostics);
  const groupAnnotationsByPath = new Map<string, OpenApiAnnotationsConfig>();
  collectGroupAnnotations(input.tree.children, input.snapshotsByRelativePath, diagnostics).forEach(
    (annotations, path) => groupAnnotationsByPath.set(path, annotations),
  );
  const endpointAnnotationsByPath = collectEndpointAnnotations(
    input.tree,
    input.snapshotsByRelativePath,
    diagnostics,
  );

  return {
    api: normalized.config,
    groupAnnotationsByPath,
    endpointAnnotationsByPath,
    diagnostics,
  };
}

function mergeOpenApiConfig(
  defaults: HttpApiOpenApiDefaults | undefined,
  override: ExtractedOpenApiConfig | undefined,
): HttpApiOpenApiDefaults {
  return {
    annotations: { ...defaults?.annotations, ...override?.annotations },
    generation: { ...defaults?.generation, ...override?.generation },
    exposure: mergeExposure(defaults?.exposure, override?.exposure),
  };
}

function mergeExposure(
  defaults: OpenApiExposureConfig | undefined,
  override: OpenApiExposureConfig | undefined,
): OpenApiExposureConfig {
  return {
    ...defaults,
    ...override,
    scalar: mergeScalar(defaults?.scalar, override?.scalar),
  };
}

function mergeScalar(
  defaults: OpenApiExposureConfig["scalar"] | undefined,
  override: OpenApiExposureConfig["scalar"] | undefined,
): OpenApiExposureConfig["scalar"] | undefined {
  if (override === false || defaults === false) return override ?? defaults;
  if (override === undefined) return defaults;
  if (defaults === undefined) return override;
  return { ...defaults, ...override };
}

function collectGroupAnnotations(
  nodes: readonly HttpApiTreeNode[],
  snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>,
  diagnostics: OpenApiConfigDiagnostic[],
): Map<string, OpenApiAnnotationsConfig> {
  const annotationsByPath = new Map<string, OpenApiAnnotationsConfig>();
  const visit = (node: HttpApiTreeNode): void => {
    if (node.type === "endpoint") return;
    if (node.type === "group") {
      const groupOverride = node.conventions.find(
        (convention) => convention.kind === "group_override",
      );
      if (groupOverride) {
        const snapshot = snapshotsByRelativePath.get(groupOverride.path);
        const extracted = snapshot ? extractOpenApiConfig(snapshot) : null;
        const normalized = normalizeOpenApiConfig("group", {
          annotations: extracted?.annotations,
          generation: extracted?.generation,
          exposure: extracted?.exposure,
        });
        diagnostics.push(...normalized.diagnostics);
        if (Object.keys(normalized.config.annotations).length > 0) {
          annotationsByPath.set(node.dirPath, normalized.config.annotations);
        }
      }
    }
    for (const child of node.children) {
      visit(child);
    }
  };
  for (const node of nodes) {
    visit(node);
  }
  return annotationsByPath;
}

function collectEndpointAnnotations(
  tree: HttpApiDescriptorTree,
  snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>,
  diagnostics: OpenApiConfigDiagnostic[],
): Map<string, OpenApiAnnotationsConfig> {
  const annotationsByPath = new Map<string, OpenApiAnnotationsConfig>();
  const rootOpenApiPaths = tree.conventions
    .filter(isOpenApiDirectoryConvention)
    .map((convention) => convention.path);

  const visit = (nodes: readonly HttpApiTreeNode[], inheritedOpenApiPaths: readonly string[]) => {
    for (const node of nodes) {
      if (node.type === "endpoint") {
        const annotations = resolveEndpointAnnotations(
          node,
          inheritedOpenApiPaths,
          snapshotsByRelativePath,
          diagnostics,
        );
        if (Object.keys(annotations).length > 0) {
          annotationsByPath.set(node.path, annotations);
        }
        continue;
      }

      const ownOpenApiPaths = node.conventions
        .filter(isOpenApiDirectoryConvention)
        .map((convention) => convention.path);
      visit(node.children, [...inheritedOpenApiPaths, ...ownOpenApiPaths]);
    }
  };

  visit(tree.children, rootOpenApiPaths);
  return annotationsByPath;
}

function resolveEndpointAnnotations(
  endpoint: HttpApiEndpointNode,
  inheritedOpenApiPaths: readonly string[],
  snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>,
  diagnostics: OpenApiConfigDiagnostic[],
): OpenApiAnnotationsConfig {
  const inherited = inheritedOpenApiPaths.map((path) =>
    normalizeOpenApiAnnotations(
      extractDefaultOpenApiConfigFromPath(path, snapshotsByRelativePath),
      "endpoint",
      diagnostics,
    ),
  );
  const companion = endpoint.companions.find((candidate) => candidate.kind === ".openapi");
  const companionAnnotations = normalizeOpenApiAnnotations(
    companion ? extractDefaultOpenApiConfigFromPath(companion.path, snapshotsByRelativePath) : null,
    "endpoint",
    diagnostics,
  );
  const inFileAnnotations = normalizeOpenApiAnnotations(
    extractOpenApiConfigFromPath(endpoint.path, snapshotsByRelativePath),
    "endpoint",
    diagnostics,
  );

  return mergeAnnotations(...inherited, companionAnnotations, inFileAnnotations);
}

function normalizeOpenApiAnnotations(
  extracted: ExtractedOpenApiConfig | null,
  scope: "endpoint" | "group",
  diagnostics: OpenApiConfigDiagnostic[],
): OpenApiAnnotationsConfig {
  const normalized = normalizeOpenApiConfig(scope, {
    annotations: extracted?.annotations,
    generation: extracted?.generation,
    exposure: extracted?.exposure,
  });
  diagnostics.push(...normalized.diagnostics);
  return normalized.config.annotations;
}

function extractOpenApiConfigFromPath(
  path: string,
  snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>,
): ExtractedOpenApiConfig | null {
  const snapshot = snapshotsByRelativePath.get(path);
  return snapshot ? extractOpenApiConfig(snapshot) : null;
}

function extractDefaultOpenApiConfigFromPath(
  path: string,
  snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>,
): ExtractedOpenApiConfig | null {
  const snapshot = snapshotsByRelativePath.get(path);
  return snapshot ? extractDefaultOpenApiConfig(snapshot) : null;
}

function isOpenApiDirectoryConvention(
  convention: DirectoryConventionRef | { readonly path: string; readonly kind: string },
): convention is DirectoryConventionRef {
  return convention.kind === "_openapi.ts";
}

function mergeAnnotations(
  ...configs: readonly OpenApiAnnotationsConfig[]
): OpenApiAnnotationsConfig {
  return Object.assign({}, ...configs);
}
