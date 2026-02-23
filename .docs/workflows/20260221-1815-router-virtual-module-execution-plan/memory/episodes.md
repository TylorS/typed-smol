## Episode: 2026-02-21 planning self-improvement loop

- objective:
  - Produce an execution-ready plan from approved requirements/spec with explicit checkpoints and rollback.

- routing_decision:
  - selected: specialist subagent (`planning-architect`)
  - rationale: planning quality improves when a specialist structures multi-workstream DAGs with validation gates.

- observe:
  - Friction risk: TS scenario coverage can get bolted on too late, weakening sequencing and safeguards.

- diagnose:
  - Root cause: plans often separate implementation steps from TS-\* acceptance mapping until execution.

- propose:
  - P1: Use checkpoint gates tied to TS-\* scenarios (CP-A/CP-B/CP-C).
  - P2: Define rollback at task granularity before coding starts.
  - P3: Make unresolved-vs-error policy explicit in early tasks.

- validate (highest-impact: P1):
  - Applied CP-A/CP-B/CP-C structure directly in `01-plan.md` with blocking scenario grouping.
  - Outcome: clearer stop/go gates and reduced sequencing ambiguity.

- consolidate:
  - Keep: TS-scenario-first planning for spec-driven implementation work.
  - Keep: phase-bound policy gates (`shouldResolve` unresolved vs `build` diagnostics) early in execution.

- apply_next:
  - Start execution at SG-A1 and do not begin SG-B until CP-A is green.

## Episode: 2026-02-21 execution progress (T-01..T-04 partial)

- observe:
  - Simple route compatibility checks from TypeInfo snapshots can over/under-match if only based on `type.text`.

- diagnose:
  - Root cause is lack of nominal route type markers in serialized snapshots; classifier currently depends on deterministic but coarse text/declaration heuristics.

- propose:
  - P1: keep fail-closed contract checks with explicit rule IDs.
  - P2: defer stricter compatibility refinement to classifier/composition phase with broader fixtures.

- validate:
  - Added deterministic rule-code failures (`RVM-ROUTE-*`, `RVM-ENTRY-*`, `RVM-LEAF-*`) and tests proving stable behavior.

- consolidate:
  - Keep deterministic fail-closed validation as baseline.
  - Revisit route compatibility precision after SG-B classification work.

## Episode: 2026-02-21 SG-B1 companion resolution and composition

- objective:
  - Implement hierarchical companion resolution (sibling + directory) and ancestor->leaf composition per spec/ADR.

- routing_decision:
  - direct: narrow scope, plugin file already known, single workstream.

- observe:
  - Companion resolution requires ordered ancestor dirs from root to leaf; path normalization must match discovery paths.

- propose:
  - resolveComposedConcernsForLeaf(leafPath, existingPaths) with ancestor dirs built by splitting leafDir.
  - Emit composedConcerns (guard/dependencies/layout/catch) in route descriptors; full Matcher codegen deferred to SG-B2.

- validate:
  - TS-4 test: nested users/profile.ts with \_guard.ts at base and users/, plus profile.guard.ts; order verified.
  - All 47 virtual-modules tests pass.

- apply_next:
  - SG-B2: entrypoint classification and normalized source generation with plain-value lifting.

## Episode: 2026-02-21 SG-B2, SG-B3, SG-C1 completion

- objective:
  - Complete entrypoint classification (needsLift), ambiguous route detection, integration tests, and CP-B/CP-C.

- routing_decision:
  - direct: bounded scope, known files, single workstream.

- completed:
  - needsLift in descriptors for plain runtimeKind.
  - RVM-AMBIGUOUS-001 for duplicate route types; throw on ambiguity.
  - shouldResolve false when directory has no .ts files (AC-9).
  - PluginManager integration tests (resolved, unresolved, error).
  - TS-5 (plain/needsLift), TS-9 (ambiguity), SG-C1 coverage.

- consolidate:
  - Shared-import fixture pattern for TS-9 (identical route types).
  - Normalize routeTypeText (trim) for identity key.

## Episode: 2026-02-21 T-06 through T-10

- objective:
  - Implement plan tasks T-06 (composition assertions), T-07 (entrypoint matrix), T-08 (TS-6/TS-7), T-09 (integration), T-10 (ambiguity ordering).

- completed:
  - T-06: Test for dependencies/layout/catch composition order in output.
  - T-07: Separate tests for effect/fx/stream classification (type names EffectHandler, FxHandler, StreamHandler); classifier regex extended to match Effect/Fx/Stream when followed by [A-Z] so type aliases count.
  - T-08: TS-6 test (build twice, same output); TS-7 test (output contains " as const;").
  - T-09: Unresolved when target has no .ts files (via PluginManager).
  - T-10: Assert thrown ambiguity message contains a.ts and b.ts with a before b.

- consolidate:
  - Entrypoint matrix covered by one plain test plus three single-route tests (effect, fx, stream) to avoid route-identity collisions.
  - Classifier: allow PascalCase type names (EffectHandler, FxHandler, StreamHandler) via [A-Z] in regex.

## Episode: 2026-02-21 T-11 and T-12 (checkpoints and docs)

- objective:
  - Complete T-11 (review-auditor: CP-A/CP-B/CP-C verification) and T-12 (docs-archivist: memory and promotion).

- completed:
  - T-11: Full vitest run—61 tests pass. CP-A (TS-1,2,3,8), CP-B (TS-4,5,6,7,9), CP-C (full rerun) all green. Coverage: @vitest/coverage-v8 not in package; documented as follow-up.
  - T-12: 99-finalization.md updated with checkpoint outcomes, memory outcomes, and promotion decision (no promotion; workflow-local only). Follow-up list includes coverage and golden tests.

- apply_next:
  - Plan complete. Optional: add coverage dependency and golden snapshot harness in a future run.
