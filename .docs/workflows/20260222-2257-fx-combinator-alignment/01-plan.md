## Requirement Anchors

| id    | statement                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1  | Every public combinator in `packages/fx` is mapped to a taxonomy family and owning module/submodule.                                        |
| FR-2  | Existing combinator implementations are internally refactored for consistency and maintainability without breaking current public behavior. |
| FR-3  | Missing combinators that are part of the relevant Effect API surface are added to `packages/fx` in a prioritized, additive rollout.         |
| FR-4  | New combinators follow Effect-aligned naming, dual call style, and semantics where applicable.                                              |
| NFR-1 | No breaking changes to existing public exports, signatures, or runtime semantics.                                                           |
| NFR-2 | Additive APIs must be test-backed and documented before release readiness.                                                                  |
| NFR-3 | All parity decisions (added/deferred/not-applicable) are explicitly recorded.                                                               |
| AC-1  | Baseline inventory and Effect parity matrix are complete for `Fx`, `Sink`, `Push`, `RefSubject`, and `Versioned`.                           |
| AC-2  | Refactor plan identifies shared internal mechanics with zero breakage risk.                                                                 |
| AC-3  | Additive combinator backlog is prioritized by risk, complexity, and user value.                                                             |
| AC-4  | Implemented refactor and additive batches pass targeted and existing tests.                                                                 |
| AC-5  | Final audit confirms no breaking deltas and clear documentation for new combinators.                                                        |

## Subgoal DAG

| subgoal_id | objective                                                                              | prerequisites | risk   | requirement_links                    | success_check                                                                |
| ---------- | -------------------------------------------------------------------------------------- | ------------- | ------ | ------------------------------------ | ---------------------------------------------------------------------------- |
| SG-1       | Freeze baseline inventory and API snapshot for current `packages/fx` combinators.      | none          | low    | FR-1, NFR-1, AC-1                    | All public exports are cataloged with signature snapshots.                   |
| SG-2       | Build Effect parity matrix: present, missing, intentionally divergent, not-applicable. | SG-1          | medium | FR-1, FR-3, NFR-3, AC-1              | Matrix maps each relevant Effect combinator family to `packages/fx` status.  |
| SG-3       | Design internal refactor architecture for shared mechanics with no breaking changes.   | SG-1          | medium | FR-2, NFR-1, AC-2                    | Refactor architecture lists extraction targets and compatibility safeguards. |
| SG-4       | Prioritize additive combinator rollout from parity matrix (Tier 1, Tier 2, Deferred).  | SG-2          | high   | FR-3, FR-4, NFR-2, NFR-3, AC-3       | Every missing combinator is triaged with rationale and wave assignment.      |
| SG-5       | Execute implementation in two tracks: refactor track + additive track.                 | SG-3, SG-4    | high   | FR-2, FR-3, FR-4, NFR-1, NFR-2, AC-4 | Refactor and additive batches compile, test, and preserve existing behavior. |
| SG-6       | Complete documentation, parity notes, and final non-breaking audit.                    | SG-5          | medium | NFR-1, NFR-2, NFR-3, AC-5            | Docs and audit confirm additive-only growth plus stable existing behavior.   |

## Ordered Tasks

| task_id | owner              | prerequisites | validation                                                                          | safeguards                                                                             | rollback                                                                     |
| ------- | ------------------ | ------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| T1      | execution-operator | none          | Export/signature snapshot generated from module indexes and symbols.                | Read-only baseline capture before code edits.                                          | Regenerate baseline snapshot from source indexes.                            |
| T2      | execution-operator | T1            | Effect parity matrix completed for `Fx`, `Sink`, `Push`, `RefSubject`, `Versioned`. | Use Effect router/module/facet ownership references as canonical taxonomy input.       | Mark uncertain mappings as unresolved and avoid speculative additions.       |
| T3      | planning-architect | T1, T2        | Internal refactor design reviewed for helper extraction and duplication reduction.  | Hard guard: no existing public signature/export changes.                               | Reduce scope to local refactors if shared extraction becomes risky.          |
| T4      | planning-architect | T2            | Additive backlog triaged into Tier 1 (low-risk), Tier 2 (medium-risk), Deferred.    | New APIs must be additive and Effect-aligned (naming, semantics, duality).             | Move ambiguous or high-risk candidates to Deferred.                          |
| T5      | execution-operator | T3            | Refactor Batch A (shared transform families) passes parity tests.                   | No edits to existing public exports except internal reorganization.                    | Revert Batch A and split into smaller internal-only chunks.                  |
| T6      | execution-operator | T4            | Additive Batch A (Tier 1 combinators) compiles and passes tests/docs checks.        | Additive symbols only; no behavior change to existing combinators.                     | Revert additive symbols that fail parity checks and keep backlog entry open. |
| T7      | execution-operator | T3, T4        | Refactor Batch B + Additive Batch B (Tier 2) pass tests and type checks.            | Preserve existing semantics; require dual call-style verification where applicable.    | Roll back failing subgroup and defer to later wave.                          |
| T8      | test-strategist    | T5, T6, T7    | Regression matrix covers existing high-risk paths plus each new combinator.         | Prefer deterministic tests; include both data-first and data-last forms for dual APIs. | Keep deterministic subset and defer unstable coverage cases.                 |
| T9      | review-auditor     | T8            | Final audit confirms non-breaking delta and complete parity decision log.           | Block release if any existing API drift is detected.                                   | Revert offending commits and rerun focused audit.                            |

## Tactical Replanning Triggers

- If a candidate “missing” combinator cannot be mapped cleanly to `packages/fx` semantics, mark it Deferred with rationale instead of forcing a mismatched API.
- If an additive combinator requires changing behavior of an existing combinator, split into a separate breaking proposal and keep this run additive-only.
- If internal refactor introduces runtime drift in existing tests, pause additive work and restore baseline semantics first.
- If dual-style ergonomics for a new combinator become ambiguous, require explicit design review before implementation.

## Memory Plan

- capture:
  - record parity matrix decisions and combinator triage outcomes in `workflows/20260222-2257-fx-combinator-alignment/memory/inbox.md`
  - log refactor and additive implementation attempts in `episodes.md`
  - summarize reusable “how to add Effect-parity combinators safely” heuristics in `reflections.md`
- promotion_criteria:
  - promote only patterns validated by code diffs, passing tests, and audit outcomes
  - require reuse potential across at least two `packages/fx` modules
  - avoid duplication with existing `.docs/_meta/memory/` entries
- recall_targets:
  - Effect ownership/taxonomy references from `.cursor/skills/effect-skill-router/references/*`
  - relevant testing heuristics (including `.docs/_meta/memory/property-testing-fastcheck.md` where applicable)

## Requirement Anchors

| id    | statement                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------- |
| FR-1  | Every public combinator in `packages/fx` is mapped to a taxonomy family and owning module/submodule.     |
| FR-2  | Implementation is refactored for internal consistency while preserving current public API and semantics. |
| FR-3  | Shared internal combinator mechanics are consolidated to reduce duplication across modules.              |
| NFR-1 | No public export names, symbol signatures, or call styles change in this refactor.                       |
| NFR-2 | No observable runtime behavior changes; existing behavior is preserved.                                  |
| NFR-3 | High-risk combinators gain targeted regression tests for parity confidence.                              |
| AC-1  | Inventory plus API snapshot is complete for `Fx`, `Sink`, `Push`, `RefSubject`, and `Versioned`.         |
| AC-2  | Refactor design identifies shared internals and touched files with zero public API delta.                |
| AC-3  | Refactor batches complete with no public API diff.                                                       |
| AC-4  | Regression tests for critical combinators pass.                                                          |
| AC-5  | Documentation clarifies semantics without renames/deprecations.                                          |

## Subgoal DAG

| subgoal_id | objective                                                                                                           | prerequisites | risk   | requirement_links              | success_check                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ------------------------------ | --------------------------------------------------------------------------- |
| SG-1       | Freeze baseline: inventory exported combinators and capture API/signature snapshot.                                 | none          | low    | FR-1, NFR-1, AC-1              | Snapshot covers all public exports; no unknown combinators remain.          |
| SG-2       | Design internal refactor architecture (shared helpers, module boundaries, touched files) with no public API edits.  | SG-1          | medium | FR-2, FR-3, NFR-1, AC-2        | Refactor design doc lists extraction targets and confirms zero API delta.   |
| SG-3       | Implement refactor batches across modules (`Fx`, `Sink`, `Push`, `RefSubject`, `Versioned`) without semantic drift. | SG-2          | high   | FR-2, FR-3, NFR-1, NFR-2, AC-3 | Code compiles, public API diff is empty, and behavior is unchanged.         |
| SG-4       | Validate parity with focused regression tests and existing suite.                                                   | SG-1, SG-3    | medium | NFR-2, NFR-3, AC-4             | Existing and new targeted tests pass, especially for high-risk combinators. |
| SG-5       | Finalize docs and audit gates for refactor-only outcome.                                                            | SG-3, SG-4    | low    | FR-2, NFR-1, AC-5              | Docs updated for clarity; explicit audit confirms no API changes.           |

## Ordered Tasks

| task_id | owner              | prerequisites | validation                                                                                         | safeguards                                                                | rollback                                                     |
| ------- | ------------------ | ------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| T1      | execution-operator | none          | Export/signature snapshot generated from current public indexes and symbols.                       | Read-only baseline capture; no code mutation.                             | Regenerate snapshot from source indexes.                     |
| T2      | execution-operator | T1            | Taxonomy map completed and duplication hotspots identified across modules.                         | Use canonical Effect taxonomy names only.                                 | Reclassify ambiguous entries and mark unresolved items.      |
| T3      | planning-architect | T2            | Internal refactor design reviewed and confirms zero public API delta.                              | Block any proposed rename/re-export/signature change.                     | Narrow to smaller internal-only extraction set.              |
| T4      | execution-operator | T3            | Batch A refactor (map/filter/filterMap/tap families) compiles and passes parity tests.             | No edits to public index exports; no symbol renames.                      | Revert batch A commit and reapply with smaller scope.        |
| T5      | execution-operator | T3            | Batch B refactor (loop/cause/switch/exhaust families) compiles and passes parity tests.            | Preserve all runtime semantics and existing call styles.                  | Revert batch B commit and isolate failing subgroup.          |
| T6      | test-strategist    | T4, T5        | Targeted regression tests cover `keyed`, loop/cause variants, switch/exhaust, and catch semantics. | Prefer deterministic tests over timing-sensitive broad integration tests. | Keep only deterministic assertions and defer flaky coverage. |
| T7      | execution-operator | T4, T5, T6    | Documentation clarifies current semantics (for example `catch`/`catchAll`) with no API rename.     | Docs-only semantics clarification; no behavior edits.                     | Revert docs edits and reword for accuracy.                   |
| T8      | review-auditor     | T6, T7        | Final audit confirms empty public API diff and passing tests.                                      | Hard gate: stop if any export/signature/public name drift is detected.    | Revert offending commits and rerun audit.                    |

## Tactical Replanning Triggers

- If any subtask requires changing public exports, symbol names, or signatures, stop and split it into a deferred non-refactor proposal.
- If refactor output changes runtime behavior (test or trace mismatch), rollback that batch and re-scope to a smaller internal extraction.
- If shared helper extraction increases complexity without measurable duplication reduction, prefer local clarity and drop the helper.
- If high-risk combinators cannot be validated deterministically, defer non-critical refactors and preserve current implementation.

## Memory Plan

- capture:
  - record duplication findings and extraction decisions in `workflows/20260222-2257-fx-combinator-alignment/memory/inbox.md`
  - log refactor attempts and reversions in `episodes.md`
  - summarize reusable internal refactor heuristics in `reflections.md`
- promotion_criteria:
  - only promote patterns validated by code diffs plus passing tests
  - require clear reuse potential across at least two `packages/fx` modules
  - avoid duplicating existing entries under `.docs/_meta/memory/`
- recall_targets:
  - Effect taxonomy/ownership references from `.cursor/skills/effect-skill-router/references/*`
  - existing testing memory, including `.docs/_meta/memory/property-testing-fastcheck.md` where applicable
