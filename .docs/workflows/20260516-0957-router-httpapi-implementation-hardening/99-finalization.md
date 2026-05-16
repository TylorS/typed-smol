# Finalization

## Changes Made

- Added a reusable generated-source type-check harness for virtual-module tests in `packages/app`.
- Hardened Router emitted source for strict generated-source compilation, including guard validation over serialized Effect/Option type shapes and typed catch wrapper parameters.
- Hardened HttpApi emitted source against installed Effect declarations by adapting non-raw handler success/error channels to declared schemas.
- Treated unrelated reserved-looking HttpApi files as non-participating while preserving diagnostics for supported convention misuse.
- Implemented installed Effect-backed OpenAPI API-scope annotations and JSON/Swagger/Scalar exposure, including Scalar CDN rendering.
- Synced durable HttpApi specs and testing strategy with the implementation and installed Effect source-of-truth.

## Verification Evidence

- `pnpm --filter @typed/app build` passed.
- `pnpm --filter @typed/app test` passed: 9 test files, 210 tests, no type errors.
- `pnpm build` passed across workspace packages and examples.
- `pnpm test` passed across workspace packages, including `@typed/app`: 9 test files, 210 tests, no type errors.

## Scenario Evidence

- Router generated-source fixtures compile representative route trees and participating concerns.
- HttpApi generated-source fixtures compile baseline endpoint/group output against installed `effect@4.0.0-beta.66` declarations.
- HttpApi OpenAPI fixtures compile generated source for `_api.ts` annotations and JSON/Swagger/Scalar exposure.
- HttpApi non-participation fixture proves `_unknown.ts` does not produce diagnostics or affect emitted source.

## Known Deferrals

- Stale `additionalProperties` generation options are not emitted because installed `OpenApi.fromApi(Api)` declarations do not accept them.
- Group and endpoint OpenAPI annotation expansion beyond current API-scope proof remains future work.
- Broader sample-project generated-source CI can build on the `packages/app` harness if host integration proof becomes necessary.
