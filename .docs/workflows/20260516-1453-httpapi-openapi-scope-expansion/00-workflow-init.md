# Workflow Init

- objective: Expand `api:` virtual-module OpenAPI support so `_api.ts` owns root generation/exposure/annotations, `_group.ts` owns group annotations, and endpoint modules/companions can attach endpoint annotations.
- started_at: 2026-05-16T14:53:00-04:00
- started_by: Codex
- source_context reviewed:
  - `packages/app/src/HttpApiVirtualModulePlugin.ts`
  - `packages/app/src/internal/extractHttpApiOpenApi.ts`
  - `packages/app/src/internal/httpapiOpenApiConfig.ts`
  - `packages/app/src/internal/emitHttpApiSource.ts`
  - `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
  - `packages/app/node_modules/effect/dist/unstable/httpapi/OpenApi.d.ts`
  - `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiGroup.d.ts`
  - `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiEndpoint.d.ts`
  - official Effect OpenApi and HttpApiBuilder generated docs
- explicit_reuse_override: false

