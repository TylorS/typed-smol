# Workflow Memories

## Task 1

- Installed `OpenApi.fromApi(Api)` still has no options parameter, so binary `openapi.generation.additionalProperties` is emitted through `OpenApi.annotations({ transform })`.
- Generated source needs a named transform helper for type-checking and readable source assertions; passing an inline function through object-literal rendering would be brittle.
- TypeInfo extraction must tolerate absent nested OpenAPI sections. Calling property walkers with `undefined` caused crashes for existing annotation/exposure-only configs.

## Task 2

- Root OpenAPI exposure now flows through the same OpenAPI plan as generation and API annotations. This was pulled forward during Task 1 so existing exposure tests stayed green after direct `_api.ts` extraction was removed.

## Task 3

- Group OpenAPI annotations are keyed by descriptor-tree group `dirPath`, not group display name. This keeps annotation lookup stable when `_group.ts` eventually overrides names.
