# Workflow Memories

## Task 1

- Installed `OpenApi.fromApi(Api)` still has no options parameter, so binary `openapi.generation.additionalProperties` is emitted through `OpenApi.annotations({ transform })`.
- Generated source needs a named transform helper for type-checking and readable source assertions; passing an inline function through object-literal rendering would be brittle.
- TypeInfo extraction must tolerate absent nested OpenAPI sections. Calling property walkers with `undefined` caused crashes for existing annotation/exposure-only configs.
