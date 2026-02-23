## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG1 | Confirm root cause for ESM load regression in VS Code path | None | low | FR-1, AC-1 | Evidence shows current resolver does not read `vmc.config.ts` plugin entries |
| SG2 | Implement resolver config loading parity with ts plugin | SG1 | medium | FR-1, FR-2, AC-1 | Resolver loads plugins from `vmc.config.ts` and honors `vmcConfigPath` override |
| SG3 | Preserve backwards compatibility with legacy tsconfig plugin list | SG2 | medium | NFR-1, AC-2 | Existing tsconfig-only plugin list still works as fallback |
| SG4 | Validate with targeted tests/checks | SG2, SG3 | medium | AC-1, AC-2 | Test suite covering resolver/plugin loading passes |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | execution-operator | SG1 | Read relevant source/tests; confirm loader inputs | No edits | N/A |
| T2 | execution-operator | T1 | Add resolver support for `loadVmcConfig` + `vmcConfigPath` | Keep legacy tsconfig parser path as fallback | Revert resolver file changes |
| T3 | execution-operator | T2 | Update/add tests for vmc config precedence and fallback behavior | Limit test scope to resolver behavior | Revert test edits if flaky |
| T4 | execution-operator | T3 | Run targeted package tests and summarize outcomes | Prefer targeted commands first | Revert code to pre-T2 state if regressions introduced |

## Tactical Replanning Triggers

- If existing tests assert tsconfig-only behavior as primary source, replan to update expected precedence with compatibility fallback.
- If vmc config loading introduces TypeScript API mismatch in VS Code package, replan to isolate loader call behind thin adapter.
- If test runtime cannot exercise real plugin loading deterministically, add focused unit-level assertions and document residual manual checks.

## Memory Plan

- capture: log root-cause pattern and config-precedence decision in workflow memory inbox/episodes.
- promotion_criteria: promote only if the resolver precedence rule is stable across packages and backed by passing tests.
- recall_targets: prior virtual-modules workflow notes under `.docs/workflows/20260221-1815-router-virtual-module-execution-plan/` and `.docs/workflows/20260221-1600-virtual-modules-vscode/`.
