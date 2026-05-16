# HttpApi OpenAPI Scope Expansion Finalization

## Completed At

2026-05-16 15:28:04 EDT

## Commits

- `45ea974 fix(app): support httpapi openapi generation config`
- `612c606 test(app): cover httpapi openapi generation exposure composition`
- `f731c11 fix(app): emit httpapi group openapi annotations`
- `f438be2 fix(app): emit httpapi endpoint openapi annotations`
- `71e25b1 fix(app): diagnose invalid httpapi openapi scopes`

## Implemented

- `_api.ts` root OpenAPI supports `annotations`, `exposure`, and binary `generation.additionalProperties`.
- Binary `additionalProperties` emits an installed-compatible OpenAPI transform annotation instead of unsupported `OpenApi.fromApi(Api, ...)` options.
- `_group.ts` supports `openapi.annotations` on generated `HttpApiGroup` expressions.
- Endpoint primary modules support named `openapi.annotations` on generated `HttpApiEndpoint` expressions.
- `<endpoint>.openapi.ts` and `_openapi.ts` support default-exported endpoint annotation configs.
- Endpoint annotation precedence is inherited `_openapi.ts` root-to-leaf, then sibling `<endpoint>.openapi.ts`, then in-file endpoint `openapi`.
- Invalid OpenAPI scope diagnostics are returned through plugin build errors:
  - `AVM-OPENAPI-001` for `generation` outside `_api.ts`.
  - `AVM-OPENAPI-002` for `exposure` outside `_api.ts`.
  - `AVM-OPENAPI-005` for object-shaped `additionalProperties`.

## Verification

- `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "additionalProperties"`: passed, 9 files, 212 tests, no type errors.
- `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "generation composes"`: passed, 9 files, 213 tests, no type errors.
- `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "_group.ts openapi.annotations"`: passed, 9 files, 214 tests, no type errors.
- `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "endpoint OpenAPI"`: passed, 9 files, 216 tests, no type errors.
- `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "AVM-OPENAPI"`: passed, 9 files, 219 tests, no type errors.
- `pnpm --filter @typed/app build`: passed.
- `pnpm --filter @typed/app test`: passed, 9 files, 219 tests, no type errors.
- `pnpm build`: passed.
- `pnpm test`: failed twice before reaching all workspace packages because `packages/id/src/Id.test.ts` failed `Ids.Test with fixed time yields deterministic time-based prefixes` only under recursive workspace execution.
- `pnpm --filter @typed/id test`: passed in isolation, 1 file, 26 tests.

## Known Deferrals

- Object-shaped `additionalProperties` schema rewriting remains unsupported and is intentionally diagnosed.
- Root `pnpm test` has an unrelated recursive-workspace `@typed/id` verification blocker; `packages/id` was not modified in this workflow.
