import type { TypeInfoFileSnapshot } from "@typed/virtual-modules";
import { extractOpenApiConfig } from "./extractHttpApiOpenApi.js";
import type { HttpApiDescriptorTree } from "./httpapiDescriptorTree.js";
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

  return {
    api: normalized.config,
    groupAnnotationsByPath: new Map(),
    endpointAnnotationsByPath: new Map(),
    diagnostics,
  };
}
