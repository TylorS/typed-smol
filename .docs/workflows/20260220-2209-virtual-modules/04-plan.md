## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| --- | --- | --- | --- | --- | --- |
| SG-1 | Scaffold `packages/virtual-modules` with package/tsconfig/test baseline | none | low | FR-1, NFR-5 | Package builds and tests execute. |
| SG-2 | Implement core plugin contract + manager first-match runtime | SG-1 | medium | FR-1, FR-2, FR-6, FR-7, NFR-1, NFR-6 | Manager resolves first-match and returns structured unresolved/error outcomes. |
| SG-3 | Implement rich structural `TypeInfoApi` (file + directory(relativeGlobs)) | SG-1 | high | FR-3, FR-11, FR-12, FR-13, NFR-2, NFR-9, NFR-10 | API returns discriminated structural types with deterministic path/glob handling. |
| SG-4 | Implement dependency descriptor registration + invalidation primitives | SG-2, SG-3 | medium | FR-14, NFR-11 | Build outputs include file/glob descriptors and stale/invalidation behavior works. |
| SG-5 | Implement `NodeModulePluginLoader` (Node resolution + sync CJS + preloaded plugins) | SG-1, SG-2 | medium | FR-8, FR-9, FR-10, NFR-7, NFR-8 | Loader resolves and normalizes plugin modules deterministically. |
| SG-6 | Implement `LanguageServiceAdapter` with host override points | SG-2, SG-3, SG-4 | high | FR-4, FR-7, FR-14, NFR-4, NFR-6 | LS adapter resolves virtual modules and updates diagnostics/version on invalidation. |
| SG-7 | Implement `CompilerHostAdapter` for type-check-only flows | SG-2, SG-3, SG-4 | high | FR-5, FR-7, NFR-4, NFR-6 | Compiler host integrates virtual modules via resolution/source overrides. |
| SG-8 | Add unit/integration tests incl. `@manuth/typescript-languageservice-tester` harness | SG-2, SG-3, SG-4, SG-5, SG-6, SG-7 | high | TS-1..TS-13 | Blocking TS scenarios pass locally. |
| SG-9 | Final package docs and API exports cleanup | SG-8 | low | NFR-5 | README and public exports match implemented API. |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| --- | --- | --- | --- | --- | --- |
| T-1 | execution-operator | SG-1 | `pnpm -r --filter @typed/virtual-modules build` | Follow existing package conventions only; no cross-package behavior changes. | Remove newly added package files if baseline fails irreparably. |
| T-2 | execution-operator | T-1 | Core manager unit tests (TS-1, TS-2) | Keep APIs synchronous and typed; avoid TS internals in public types. | Revert manager internals while preserving scaffolding. |
| T-3 | execution-operator | T-1 | Type info API tests (TS-3, TS-9, TS-10) | Isolate extraction/serialization logic behind one module boundary. | Fall back to reduced shape while preserving discriminated `kind` contract. |
| T-4 | execution-operator | T-2, T-3 | Dependency/watch unit tests (TS-11) | Use deterministic descriptors; avoid implicit global state. | Disable watch wiring temporarily behind feature guard and keep descriptor generation. |
| T-5 | execution-operator | T-2 | Loader tests (TS-6, TS-7) | Keep loader bootstrap-only; no runtime resolution calls. | Keep preloaded-plugin path and mark CJS loader as not-ready with typed errors. |
| T-6 | execution-operator | T-2, T-3, T-4 | LS integration tests with `@manuth/typescript-languageservice-tester` (TS-4, TS-12) | Patch only targeted host/LS methods; preserve delegation for non-virtual paths. | Disable advanced hooks (`getProjectVersion`, watch) if unstable; retain core resolution/snapshot path. |
| T-7 | execution-operator | T-2, T-3, T-4 | Compiler adapter integration tests (TS-5, TS-13) | Implement preferred + fallback resolution hooks; delegate unresolved paths. | Keep fallback-only path if literals hook unsupported in target host. |
| T-8 | execution-operator | T-5, T-6, T-7 | Full package tests + lint + build | Run blocking scenarios before docs cleanup. | Revert latest task-level changeset, retain last green state. |
| T-9 | execution-operator | T-8 | README/export checks | Do not introduce new concepts outside canonical files. | Revert doc/export-only changes. |

## Tactical Replanning Triggers

- If LS adapter cannot safely patch expected host methods in tsserver-backed tests, replan to support explicit adapter modes (`owned-host` and `plugin-host`) while preserving FR-4 behavior where technically feasible.
- If TypeScript 5.9 signatures differ from assumptions, replan around concrete local type declarations and add compatibility shims.
- If watch callback churn causes flaky tests, replan with deterministic debounce helpers and explicit scheduler control in tests.

## Memory Plan

- capture:
  - `.docs/workflows/20260220-2209-virtual-modules/memory/inbox.md`
  - `.docs/workflows/20260220-2209-virtual-modules/memory/episodes.md`
- promotion_criteria:
  - promote only stable adapter-integration patterns that pass TS-1..TS-13 and are not duplicated in existing canonical docs.
- recall_targets:
  - `.docs/_meta/memory/spec-authoring-mermaid.md` (visual spec requirement).
