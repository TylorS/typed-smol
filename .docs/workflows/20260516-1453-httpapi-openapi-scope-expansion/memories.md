# Workflow Memories

## Task 1

- Installed `OpenApi.fromApi(Api)` still has no options parameter, so binary `openapi.generation.additionalProperties` is emitted through `OpenApi.annotations({ transform })`.
- Generated source needs a named transform helper for type-checking and readable source assertions; passing an inline function through object-literal rendering would be brittle.
- TypeInfo extraction must tolerate absent nested OpenAPI sections. Calling property walkers with `undefined` caused crashes for existing annotation/exposure-only configs.

## Task 2

- Root OpenAPI exposure now flows through the same OpenAPI plan as generation and API annotations. This was pulled forward during Task 1 so existing exposure tests stayed green after direct `_api.ts` extraction was removed.

## Task 3

- Group OpenAPI annotations are keyed by descriptor-tree group `dirPath`, not group display name. This keeps annotation lookup stable when `_group.ts` eventually overrides names.

## Task 4

- Endpoint OpenAPI precedence is implemented as inherited `_openapi.ts` defaults first, then sibling `<endpoint>.openapi.ts`, then in-file endpoint `openapi`. Later layers override earlier annotation keys.
- Companion and inherited endpoint OpenAPI files use default exports; endpoint primary modules use named `openapi`.

## Task 5

- Invalid OpenAPI scope diagnostics were already wired during earlier task implementation: `_group.ts` and endpoint configs call `normalizeOpenApiConfig`, object-shaped root `additionalProperties` emits `AVM-OPENAPI-005`, and `HttpApiVirtualModulePlugin` returns `openapiPlan.diagnostics` as build errors.
- The focused `AVM-OPENAPI` test run passed immediately after adding plugin-level tests, so no production changes were needed for Task 5.
