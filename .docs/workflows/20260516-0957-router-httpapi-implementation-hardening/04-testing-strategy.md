# Testing Strategy — Router and HttpApi Implementation Hardening

Status: approved.

## Test Type Taxonomy

- unit:
  - role classification and non-participation rules;
  - OpenAPI config normalization and conflict detection;
  - small render helpers for Effect HttpApi API calls;
  - Router descriptor validation and renderer invariant guards.
- integration:
  - real plugin build with `TypeInfoApi` sessions;
  - emitted Router/HttpApi source type-checking in `packages/app` Vitest fixtures;
  - structured diagnostics from invalid participating source files.
- e2e:
  - N/A for this tranche unless package-level generated-source fixtures reveal Vite/vmc/editor host behavior that cannot be represented in `packages/app`.

## Critical Path Scenarios

| ts_id | scenario                                                                                                                                                      | maps_to_fr_nfr                        | maps_to_ac             | blocking |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- | -------- |
| TS-1  | Router emitted source type-checks for mixed plain/Effect/Stream/Fx entrypoint kinds.                                                                          | FR-2, FR-6, FR-11, NFR-1, NFR-6       | AC-1, AC-4, AC-8       | yes      |
| TS-2  | Router emitted source type-checks for nested route trees with directory and sibling guard/dependency/layout/catch concerns.                                   | FR-2, FR-6, FR-7, NFR-1, NFR-2        | AC-1, AC-4, AC-5       | yes      |
| TS-3  | User-reachable invalid Router concern metadata returns structured diagnostics rather than renderer throws.                                                    | FR-7, NFR-2, NFR-3                    | AC-5                   | yes      |
| TS-4  | HttpApi emitted source type-checks for API/group/endpoint assembly, normal handlers, raw handlers, optional headers/body/success/error exports, and prefixes. | FR-3, FR-5, FR-6, FR-11, NFR-5, NFR-6 | AC-2, AC-3, AC-4, AC-8 | yes      |
| TS-5  | HttpApi emitted source type-checks for OpenAPI JSON/Swagger/Scalar inline/Scalar CDN exposure using installed Effect APIs.                                    | FR-3, FR-8, FR-10, NFR-5, NFR-6       | AC-2, AC-6, AC-7       | yes      |
| TS-6  | HttpApi generated source represents supported OpenAPI annotations at API/group/endpoint scopes or emits approved diagnostics/deferrals.                       | FR-5, FR-10, NFR-2, NFR-5             | AC-3, AC-7             | yes      |
| TS-7  | Stale unsupported OpenAPI generation config such as `additionalProperties` does not produce guessed generated code.                                           | FR-4, FR-8, NFR-2, NFR-5              | AC-2, AC-6, AC-7       | yes      |
| TS-8  | Reserved-looking unmatched HttpApi files do not participate and do not block generated source.                                                                | FR-5, FR-9, NFR-2                     | AC-3, AC-5             | yes      |
| TS-9  | Duplicate/colliding supported HttpApi conventions produce structured diagnostics.                                                                             | FR-5, FR-7, FR-9, NFR-2, NFR-3        | AC-3, AC-5             | yes      |
| TS-10 | Package-level `pnpm --filter @typed/app build` and `pnpm --filter @typed/app test` pass after all hardening tasks.                                            | FR-1, NFR-6                           | AC-1 through AC-8      | yes      |

## Coverage Targets

- critical_path_target:
  - 100% of blocking TS scenarios must pass before execution-stage completion.
- code_coverage_target:
  - No numeric coverage target for this tranche; generated-source type-check scenarios are the release gate.
- validation_hooks:
  - `pnpm --filter @typed/app test`
  - `pnpm --filter @typed/app build`
  - targeted Vitest runs for changed test files during red-green loops

## Dependency Readiness Matrix

| dep                                                           | status  | unblock_action                                     |
| ------------------------------------------------------------- | ------- | -------------------------------------------------- |
| `packages/app/node_modules/effect@4.0.0-beta.66` declarations | ready   | none                                               |
| existing `TypeInfoApi` test harness helpers                   | ready   | reuse and extract if duplication blocks clarity    |
| generated-source fixture writer/compiler helper               | partial | implement in `packages/app` tests before TS-1/TS-4 |
| Router virtual module plugin                                  | ready   | harden through planned slices                      |
| HttpApi virtual module plugin                                 | ready   | harden through planned slices                      |

## Acceptance Failure Policy

- Any failing blocking TS scenario blocks completion of the matching execution task.
- If generated source does not type-check, fix the emitter or spec; do not weaken the fixture.
- If an installed Effect declaration conflicts with durable docs, update/defer the durable doc item rather than casting generated source.
- If a fixture fails because the harness cannot represent the generated module shape, improve the harness before changing plugin behavior.
