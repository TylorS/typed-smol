import type { TypeInfoFileSnapshot } from "@typed/virtual-modules";
import { extractOpenApiConfig } from "./extractHttpApiOpenApi.js";
import type { HttpApiDescriptorTree, HttpApiTreeNode } from "./httpapiDescriptorTree.js";
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

export function buildHttpApiOpenApiPlan(input: {
  readonly tree: HttpApiDescriptorTree;
  readonly snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>;
}): HttpApiOpenApiPlan {
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  const apiRoot = input.tree.conventions.find((convention) => convention.kind === "api_root");
  const apiRootSnapshot = apiRoot ? input.snapshotsByRelativePath.get(apiRoot.path) : undefined;
  const extracted = apiRootSnapshot ? extractOpenApiConfig(apiRootSnapshot) : null;
  const normalized = normalizeOpenApiConfig("api", {
    annotations: extracted?.annotations,
    generation: extracted?.generation,
    exposure: extracted?.exposure,
  });
  diagnostics.push(...normalized.diagnostics);
  const groupAnnotationsByPath = new Map<string, OpenApiAnnotationsConfig>();
  collectGroupAnnotations(input.tree.children, input.snapshotsByRelativePath, diagnostics).forEach(
    (annotations, path) => groupAnnotationsByPath.set(path, annotations),
  );

  return {
    api: normalized.config,
    groupAnnotationsByPath,
    endpointAnnotationsByPath: new Map(),
    diagnostics,
  };
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
