## Subgoal DAG

| subgoal_id | objective                                          | prerequisites | risk | requirement_links | success_check                                                         |
| ---------- | -------------------------------------------------- | ------------- | ---- | ----------------- | --------------------------------------------------------------------- |
| S1         | Add resolveEffectiveImporter to VirtualRecordStore | —             | low  | FR-3, NFR-1       | Unit test: returns input when not virtual; walks chain; handles cycle |
| S2         | Update LanguageServiceAdapter                      | S1            | low  | FR-1              | LS test: virtual-imports-virtual resolves, B gets real importer       |
| S3         | Update CompilerHostAdapter                         | S1            | low  | FR-1              | CH test: same                                                         |
| S4         | Update Vite plugin resolveId                       | —             | low  | FR-2              | Vite test: encoded importer decodes and resolves                      |
| S5         | Add tests for all adapters                         | S2, S3, S4    | —    | AC-1..AC-5        | All acceptance criteria pass                                          |
| S6         | Remove debug logging                               | —             | none | —                 | No /tmp writes                                                        |
| S7         | Lint and type-check                                | S1..S6        | —    | —                 | Clean build                                                           |
| S8         | Finalization                                       | S7            | —    | —                 | 99-finalization.md, merge to main                                     |

## Ordered Tasks

| task_id | owner | prerequisites | validation                                            | safeguards               | rollback                  |
| ------- | ----- | ------------- | ----------------------------------------------------- | ------------------------ | ------------------------- |
| T1      | impl  | —             | resolveEffectiveImporter exists and tested            | Cycle detection          | Revert VirtualRecordStore |
| T2      | impl  | T1            | LS resolveModuleNames/Literals use effective importer | —                        | Revert LS adapter         |
| T3      | impl  | T1            | CH resolveModuleNames/Literals use effective importer | —                        | Revert CH adapter         |
| T4      | impl  | —             | Vite resolveId decodes importer                       | Validate decoded payload | Revert vitePlugin         |
| T5      | impl  | T2,T3,T4      | Tests pass                                            | —                        | Revert test files         |
| T6      | impl  | —             | Debug log removed                                     | Grep for /tmp            | Revert LS adapter         |
| T7      | impl  | T1..T6        | pnpm build, ReadLints                                 | —                        | Revert all                |
| T8      | impl  | T7            | 99-finalization.md, merge                             | Cohesion check           | —                         |

## Tactical Replanning Triggers

- If resolveEffectiveImporter cannot access recordsByVirtualFile (closure), expose via options or return from createVirtualRecordStore.
- If Vite decoded importer is also encoded (nested), recurse decode until real path (unlikely; Vite typically uses file path for entry).

## Memory Plan

- capture: 01/02/03/04/05 artifacts in workflow
- promotion_criteria: Feature validated in production; no regressions
- recall_targets: virtual-modules AGENTS.md, production-readiness.md
