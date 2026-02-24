## Subgoal DAG


| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Define API parser + AST skeleton (`api:` resolver, tree nodes, stable ordering). | approved requirements/spec | medium | FR-1, FR-2, FR-20, FR-21, NFR-1, NFR-10 | `api:` parser + AST node model compile with deterministic ordering tests. |
| SG-2 | Implement file-role matrix, precedence resolution, and directory/group planner with pathless directory support. | SG-1 | medium-high | FR-4, FR-5, FR-8, FR-11, FR-16, FR-23, NFR-2, NFR-7 | fixtures produce deterministic descriptors for supported file roles and `(pathless)` dirs. |
| SG-3 | Implement endpoint/schema structural validation and typed handler helper (`Schema.TaggedRequest`-centered). | SG-1 | high | FR-6, FR-7, FR-15, FR-16, FR-24, NFR-3, NFR-6, NFR-9 | invalid contracts fail with typed diagnostics; helper infers context and rejects mismatches. |
| SG-4 | Implement OpenAPI config mapper + exposure planner using Effect-backed option matrix. | SG-2 | high | FR-13, FR-25, NFR-2, NFR-9 | annotation/generation/exposure options map to supported Effect APIs with scope/route diagnostics. |
| SG-5 | Implement deterministic source renderer from AST + descriptors + OpenAPI plan. | SG-2, SG-3, SG-4 | medium | FR-14, FR-21, NFR-2, NFR-10 | stable source snapshots across repeated builds with equivalent inputs. |
| SG-6 | Add `resolveHttpApiTypeTargets` and wire host/session structural assignability checks. | SG-1 | medium | FR-15, FR-17, NFR-6 | assignable targets populate and drive structural checks in integration tests. |
| SG-7 | Integrate plugin into `@typed/vite-plugin` with `apiVmOptions` and deterministic registration order. | SG-5, SG-6 | medium | FR-22, NFR-1, NFR-5 | Vite integration fixture resolves both `router:` and `api:` modules. |
| SG-8 | Add end-to-end fixtures and CI gates for TS-1..TS-16 critical scenarios. | SG-7 | medium-high | FR-19, FR-23, FR-24, FR-25, NFR-2, NFR-9 | all blocking TS scenarios pass locally and in CI gate plan. |


## Ordered Tasks


| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T-1 | execution-operator | none | compile after adding `api:` parser + AST scaffolding | avoid changing router plugin behavior; isolate new files/types | remove parser/AST files and restore plugin exports |
| T-2 | execution-operator | T-1 | unit tests for role classification, precedence, and file-role matrix parsing | freeze canonical ordering rules before renderer work | revert AST comparator and role-classification snapshots |
| T-3 | execution-operator | T-1 | contract tests for endpoint required exports + `Schema.TaggedRequest` validation + typed helper inference | keep diagnostics centralized with stable IDs | revert validator/helper mappings and diagnostics |
| T-4 | execution-operator | T-2 | OpenAPI config mapper tests for annotation keys, `additionalProperties`, exposure route conflicts, and scope checks | enforce Effect-backed key whitelist only | revert OpenAPI mapper and conflict-check logic |
| T-5 | execution-operator | T-2, T-3, T-4 | snapshot tests for renderer output from AST + OpenAPI plan | renderer must consume AST + normalized config only | revert renderer entrypoint and regenerate snapshots |
| T-6 | execution-operator | T-1 | integration tests for `resolveHttpApiTypeTargets` assignability | preserve fallback behavior with explicit degraded diagnostics | revert target resolver/session wiring |
| T-7 | execution-operator | T-5, T-6 | Vite integration tests in `packages/vite-plugin` for `apiVmOptions` + registration order | avoid regressions in existing `routerVmOptions` behavior | remove `apiVmOptions` and registration changes |
| T-8 | test-strategist | T-7 | run TS-1..TS-16 + lint + `pnpm build` | gate merge on 100% blocking scenario pass rate | revert failing fixture-specific deltas first, then isolate root-cause module |


## Tactical Replanning Triggers

- Any failing blocking scenario (`TS-*`) in `testing-strategy.md`.
- Discovery/AST model cannot represent a required precedence case without ad-hoc escape hatches.
- Structural `assignableTo` checks unavailable for required HttpApi symbols in fixture programs.
- Vite integration introduces regression in existing `routerVmOptions` behavior.

## Memory Plan

- capture:
  - add AST design lessons and precedence edge-cases to `memory/inbox.md` and `memory/episodes.md`.
  - record diagnostics ID conventions and parse/render separation pitfalls in `memory/reflections.md`.
- promotion_criteria:
  - promote only if a pattern is validated by passing TS-1..TS-16 scenarios and reused in at least two modules/tests.
- recall_targets:
  - `.docs/_meta/memory/typeinfoapi-structural-type-targets.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`

