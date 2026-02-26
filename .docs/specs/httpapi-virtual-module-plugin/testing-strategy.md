## Test Type Taxonomy

- unit:
  - `api:` ID parsing and target resolution.
  - role classification and companion filtering.
  - filesystem tree AST parse and node-order determinism.
  - parenthesized pathless directory group planning.
  - precedence resolution (in-file > sibling > directory).
  - endpoint contract and `Schema.TaggedRequest` validation helpers.
  - typed handler helper (`defineApiHandler`) context and return/error inference tests.
  - deterministic source generation ordering and naming from AST input only.
- integration:
  - plugin-manager resolution (`resolved | unresolved | error`) with real `TypeInfoApi` session.
  - structural `assignableTo` behavior with `resolveHttpApiTypeTargets`.
  - watch descriptor registration and invalidation behavior in adapter harness.
  - generated builder wiring (`HttpApiBuilder.group`, `handle`, `handleRaw`) compile checks.
  - `typedVitePlugin` registration order and option wiring (`routerVmOptions`, `apiVmOptions`) checks.
- e2e:
  - fixture app importing `api:./apis` with nested groups, pathless directories, and companions.
  - fixture app using `typedVitePlugin` with both router + api virtual modules in one project.
  - full generated source type-check and optional runtime smoke validation for OpenAPI exposure controls.

## Critical Path Scenarios

| ts_id | scenario                                                                                                                                        | maps_to_fr_nfr                         | maps_to_ac  | blocking |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- | -------- |
| TS-1  | `api:./apis` resolves synchronously and deterministically through plugin manager                                                                | FR-1, NFR-1, NFR-5                     | AC-1        | yes      |
| TS-2  | Mixed script tree is discovered deterministically with router-style precedence behavior                                                         | FR-2, FR-11, NFR-2, NFR-4              | AC-2        | yes      |
| TS-3  | Directory mapping creates named groups while `(pathless)` dirs do not create new group names                                                    | FR-4, FR-5, NFR-7, NFR-9               | AC-3        | yes      |
| TS-4  | Missing/invalid endpoint route/method/schema/handler contracts fail with typed diagnostics                                                      | FR-6, FR-7, FR-15, FR-16, NFR-3, NFR-6 | AC-4, AC-11 | yes      |
| TS-5  | Endpoint naming defaults to filename slug and supports deterministic explicit override                                                          | FR-8, NFR-9                            | AC-5        | yes      |
| TS-6  | Group conventions produce deterministic `HttpApiGroup` composition (prefix/error/middleware/annotations)                                        | FR-9, NFR-2                            | AC-6        | yes      |
| TS-7  | Handler conventions generate valid `HttpApiBuilder` wiring for `handle`/`handleRaw`                                                             | FR-10, NFR-2                           | AC-7        | yes      |
| TS-8  | OpenAPI controls configure output metadata and visibility deterministically                                                                     | FR-13, NFR-9                           | AC-9        | yes      |
| TS-9  | Generated module exports API assembly and builder-layer wiring with stable source text                                                          | FR-14, NFR-2                           | AC-10       | yes      |
| TS-10 | Watch descriptors are registered and a touched dependency causes targeted invalidation/rebuild                                                  | FR-17, NFR-1                           | AC-12       | yes      |
| TS-11 | Optional generated type-check mode returns deterministic warnings/errors without crash                                                          | FR-19, NFR-3                           | AC-13       | yes      |
| TS-12 | Same snapshots always parse to the same filesystem tree AST and renderer consumes AST-only input                                                | FR-20, FR-21, NFR-2, NFR-10            | AC-14       | yes      |
| TS-13 | `typedVitePlugin` registers router + api VM plugins with deterministic order and resolves `api:` import                                         | FR-22, NFR-1, NFR-5                    | AC-15       | yes      |
| TS-14 | Supported file-role matrix is enforced and unsupported reserved companion names emit diagnostics                                                | FR-23, NFR-2, NFR-7                    | AC-16       | yes      |
| TS-15 | Typed handler helper infers context (`params/path/query/body/headers`) and rejects shape mismatches at compile time                             | FR-24, NFR-6, NFR-9                    | AC-17       | yes      |
| TS-16 | OpenAPI options map to Effect-supported matrix (annotations/additionalProperties/json/swagger/scalar) with scope and route-conflict diagnostics | FR-13, FR-25, NFR-2, NFR-9             | AC-18       | yes      |

## Coverage Targets

- critical_path_target:
  - 100% pass for blocking TS scenarios (`TS-1` through `TS-16`) in CI before merge.
- code_coverage_target:
  - > = 90% line coverage and >= 85% branch coverage across plugin/core helper modules.
- validation_hooks:
  - unit + integration tests in PR CI.
  - generated fixture type-check (`tsc -b` or equivalent) in PR CI.
  - snapshot stability check for generated source text.

## Dependency Readiness Matrix

| dep                                                                      | status  | unblock_action                                                                 |
| ------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------ |
| `@typed/virtual-modules` plugin manager + TypeInfoApi                    | ready   | none                                                                           |
| `@typed/app` router plugin helpers (for precedence/path parity patterns) | ready   | none                                                                           |
| `effect/unstable/httpapi` type availability in compilation context       | partial | add explicit fixture imports and target resolution checks for required symbols |
| `resolveHttpApiTypeTargets` helper implementation                        | missing | implement helper + tests before execution stage                                |
| `typedVitePlugin` api VM option surface + registration wiring            | missing | add `apiVmOptions` contract and integration tests in `packages/vite-plugin`    |
| typed handler helper runtime/type surface (`defineApiHandler`)           | missing | implement helper API and add compile-time positive/negative typing tests       |
| OpenAPI config mapper + exposure planner (Effect-backed option matrix)   | missing | implement key/scope validation + route-conflict checks + fixture coverage      |
| fixture package for `api:` virtual module generation                     | missing | scaffold fixture under examples or sample project and wire to CI               |
| OpenAPI metadata control fixture + assertions                            | missing | add dedicated fixture conventions and snapshot assertions                      |

## Acceptance Failure Policy

- Any failing blocking TS scenario blocks execution-stage completion and release readiness.
- For each failure:
  1. record failing TS ID(s), error output, and affected FR/NFR/AC links,
  2. patch smallest scope that resolves the failure,
  3. rerun failed scenario(s) and all directly affected blocking TS scenarios,
  4. update execution log with evidence and any local replanning.
- If a failure depends on an incomplete dependency, prioritize unblocking that dependency before further feature work.
