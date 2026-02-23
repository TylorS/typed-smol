## Subgoal DAG

| subgoal_id | objective                                                                                                                                                                                                                        | prerequisites | risk   | requirement_links                                                                    | success_check                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| SG-A1      | Establish plugin module boundary and phase policy (`shouldResolve` unresolved vs `build` structured failure), then implement `router:./<directory>` target resolution with normalized under-base paths.                          | none          | medium | FR-1, FR-11, FR-12, NFR-1, NFR-3, NFR-5, NFR-6, AC-1, AC-9, AC-10                    | Deterministic parser/path tests pass; sync-only flow; TS-1 and TS-8 smoke pass.         |
| SG-A2      | Discover candidates from regular `*.ts` using `TypeInfoApi.directory("**/*.ts", ...)`, exclude companion-only files, and produce stable deterministic order.                                                                     | SG-A1         | high   | FR-2, FR-11, NFR-2, NFR-5, NFR-7, NFR-9, AC-2, AC-10                                 | TS-2 passes with mixed separators and repeated-run stable ordering.                     |
| SG-A3      | Validate route leaf contract with TypeInfo (`route` compatible with `Route.Any`, exactly one of `handler/template/default`) and emit rule-ID diagnostics with file context.                                                      | SG-A2         | high   | FR-2, FR-3, FR-9, FR-13, NFR-3, NFR-9, AC-3, AC-7                                    | TS-3 passes; invalid files are rejected deterministically without host crash.           |
| SG-CP-A    | **Checkpoint A (bounded gate):** freeze and verify resolver/discovery/validation baseline before composition work.                                                                                                               | SG-A3         | medium | TS-1, TS-2, TS-3, TS-8                                                               | All CP-A scenarios pass; no async regressions introduced.                               |
| SG-B1      | Resolve sibling and directory companions (`*.guard.ts`, `*.dependencies.ts`, `*.layout.ts`, `*.catch.ts`, `_guard.ts`, `_dependencies.ts`, `_layout.ts`, `_catch.ts`) and compose ancestor->leaf semantics aligned with Matcher. | SG-CP-A       | high   | FR-4, FR-5, FR-6, FR-8, NFR-2, NFR-8, AC-4                                           | TS-4 passes: guard AND, dependency concat, layout/catch outer->inner ordering verified. |
| SG-B2      | Classify entrypoints (fx/effect/stream/plain) deterministically and generate normalized source with generation-time plain-value lifting + readonly descriptor metadata.                                                          | SG-B1         | high   | FR-7, FR-8, FR-10, FR-13, FR-14, NFR-1, NFR-2, NFR-4, NFR-9, AC-5, AC-6, AC-8, AC-11 | TS-5/TS-6/TS-7 pass; unchanged inputs keep semantically identical output.               |
| SG-B3      | Detect duplicate/ambiguous route definitions with deterministic identity and rule-ID diagnostics ordering.                                                                                                                       | SG-B1         | medium | FR-9, NFR-2, NFR-8, AC-7                                                             | TS-9 passes with stable diagnostics across repeated runs.                               |
| SG-CP-B    | **Checkpoint B (bounded gate):** verify feature completeness before integration hardening.                                                                                                                                       | SG-B2, SG-B3  | medium | TS-4, TS-5, TS-6, TS-7, TS-9                                                         | All CP-B scenarios pass; generator and diagnostics are stable.                          |
| SG-C1      | Integrate plugin outcomes cleanly with manager/host (resolved/unresolved/error) and preserve non-crashing diagnostics behavior.                                                                                                  | SG-CP-B       | medium | FR-1, FR-9, FR-12, NFR-3, NFR-6, AC-1, AC-7, AC-9                                    | Integration tests confirm expected manager outcome behavior and host safety.            |
| SG-CP-C    | **Checkpoint C (release gate):** full TS-1..TS-9 rerun, coverage target check, and memory capture/promotion decision.                                                                                                            | SG-C1         | medium | TS-1..TS-9, NFR-4                                                                    | Blocking TS scenarios all green; golden stability green; memory updates recorded.       |

## Ordered Tasks

| task_id | owner              | prerequisites | validation                                                                                               | safeguards                                                                                            | rollback                                                                                       |
| ------- | ------------------ | ------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| T-01    | execution-operator | none          | Build/typecheck after scaffold and exports are added for plugin home.                                    | Keep changes additive; no async interfaces; keep package boundaries explicit.                         | Revert only new plugin exports/dependency additions.                                           |
| T-02    | execution-operator | T-01          | Unit tests for `router:` ID parsing, relative-dir syntax, under-base path checks, and unresolved branch. | Reuse existing path normalization utilities; reject path-escape deterministically.                    | Force unresolved for all invalid target cases until parser is corrected.                       |
| T-03    | execution-operator | T-02          | TS-2 fixture validates regular `*.ts` discovery and deterministic ordering.                              | Explicitly ban `*.route.ts` assumptions; maintain companion exclusion list in one canonical constant. | Fallback to empty candidate set + deterministic diagnostic (no nondeterministic partial scan). |
| T-04    | execution-operator | T-03          | TS-3 invalid-contract fixtures (missing route, bad route type, bad one-of).                              | Central diagnostic catalog with stable rule IDs and path context.                                     | Mark uncertain candidates invalid with explicit diagnostic; do not throw raw exceptions.       |
| T-05    | execution-operator | T-04          | TS-4 nested fixture for sibling + directory companion resolution and ordering.                           | Canonical naming only; deterministic ancestor traversal root->leaf.                                   | Temporarily disable only failing companion category while preserving core leaf route behavior. |
| T-06    | execution-operator | T-05          | Composition assertions match expected guard/dependencies/layout/catch semantics.                         | Single pure composition planner function; deterministic input/output ordering.                        | Revert to leaf-only composition path behind guarded branch while preserving diagnostics.       |
| T-07    | execution-operator | T-04          | TS-5/AC-11 entrypoint matrix for `fx/effect/stream/plain`.                                               | Deterministic classifier precedence; unknown kind emits rule-ID diagnostic, never silent coercion.    | Route marked invalid-unclassifiable; continue processing remaining routes.                     |
| T-08    | execution-operator | T-06, T-07    | TS-5/TS-6/TS-7 for generation, golden stability, and readonly-literal inference.                         | Stable import sort and source emitter normalization; no runtime-only plain wrapping path.             | Disable lifting optimization only (temporary), keep normalized generation path intact.         |
| T-09    | execution-operator | T-08          | Integration tests through PluginManager and adapter-facing paths for resolved/unresolved/error.          | Enforce phase-bound policy; degrade to unresolved on integration uncertainty.                         | Retain structured logs.                                                                        |
| T-10    | execution-operator | T-06          | TS-9 ambiguity fixtures with deterministic conflict ordering.                                            | Canonical route identity key and stable tie-break sort.                                               | Keep first stable winner + emit deterministic ambiguity diagnostic.                            |
| T-11    | review-auditor     | T-09, T-10    | **CP-A:** TS-1/2/3/8, **CP-B:** TS-4/5/6/7/9, **CP-C:** full rerun + coverage thresholds.                | Stop-the-line on blocking TS failures; no partial acceptance of CP gates.                             | Revert to previous green checkpoint and re-apply last batch incrementally.                     |
| T-12    | docs-archivist     | T-11          | Memory updates recorded in workflow memory and promotion decision documented.                            | Promote only non-duplicative, evidence-backed insights after green blocking scenarios.                | Defer promotion; keep notes workflow-local if confidence is insufficient.                      |

## Tactical Replanning Triggers

- **TR-1: Route compatibility check is non-deterministic from TypeInfo snapshots.**
  - Action: replan only SG-A3/T-04; adopt stricter fail-closed diagnostic rule and postpone broad classifier changes.
- **TR-2: Empty-directory handling conflicts (`unresolved` vs structured invalid).**
  - Action: execute a policy gate in SG-A1; document one canonical behavior and align tests before continuing.
- **TR-3: Composition behavior diverges from `Matcher` semantics in fixtures.**
  - Action: isolate to SG-B1/T-05/T-06 and correct composition planner without touching resolver/discovery.
- **TR-4: Entrypoint classification drifts across runs or OS environments.**
  - Action: tighten classifier precedence + deterministic fallback diagnostics in SG-B2/T-07.
- **TR-5: Golden output churn appears without input changes.**
  - Action: freeze feature additions, normalize emitter ordering/path formatting, rerun TS-6 before proceeding.
- **TR-6: Any blocking TS scenario fails at a checkpoint.**
  - Action: halt forward progress, rollback to last green checkpoint, fix failing scenario first, then rerun affected blocking set.

## Memory Plan

- capture:
  - Record policy decisions for unresolved/error behavior, classifier precedence, ambiguity identity key, and deterministic sort keys.
  - Record checkpoint outcomes (CP-A/B/C) with TS IDs and root-cause notes.
  - Capture diagnostic rule-ID additions/renames and rationale.
- promotion_criteria:
  - Promote only after CP-C is green for all blocking TS scenarios.
  - Promote only non-duplicative insights reusable beyond this plugin.
  - Require evidence from deterministic cross-platform path behavior validation.
- recall_targets:
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/router-virtual-module-plugin/requirements.md`
  - `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`
  - `.docs/specs/virtual-modules/spec.md`
  - `packages/virtual-modules/src/types.ts`
  - `packages/virtual-modules/src/TypeInfoApi.ts`
  - `packages/router/src/Matcher.ts`
  - `.docs/workflows/20260221-1705-router-virtual-module-brainstorm/memory/episodes.md`
