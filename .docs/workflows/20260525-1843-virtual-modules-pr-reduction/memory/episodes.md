# Memory Episodes

## T0 - Baseline and ownership scan

- objective: establish dirty-worktree and wrapper-name baseline before execution.
- evidence:
  - `git status --short --branch` showed branch `codex/typed-beta` ahead of origin with unrelated dirty files.
  - Source/docs wrapper scan found T1-owned wrapper surfaces in `packages/app/src/internal/emitHttpApiSource.ts`, `packages/app/src/HttpApiVirtualModulePlugin.ts`, `packages/app/src/HttpApiVirtualModulePlugin.test.ts`, `packages/app/src/internal/emitStorybookSource.ts`, `packages/app/src/StorybookVirtualModulePlugin.test.ts`, and `examples/realworld/src/Home.stories.ts`.
  - Artifact scan found stale wrapper names in `examples/realworld/node_modules/.typed/virtual`.
  - Focused status check found no direct dirty output for exact T1 owner paths.
- outcome: T1 may proceed in exact owner paths; broader RealWorld edits require ownership reconciliation first.

## T1 - Raw HttpApi client cleanup

- objective: remove `TypedClient` wrapper generation and prove raw Effect client fidelity.
- evidence:
  - RED app test failed before implementation with expected HttpApi and Storybook generated-source failures.
  - GREEN app test passed with 35 files, 448 tests, and no type errors.
  - `pnpm --filter @typed/app build` passed.
  - RealWorld Storybook build passed after `examples/realworld/node_modules/.typed/virtual` cleanup.
  - Source and regenerated artifact scans found no banned wrapper names.
  - Spec compliance review approved with no findings.
  - Code-quality review requested two no-API Storybook fallback fixes; both were applied and re-reviewed as approved.
- outcome: committed `8687cfd` (`fix(app): remove generated typed http clients`).

## T2 - Production closure core contract

- objective: add a shared dependency-closure contract and thread it through Vite build context/artifact reuse.
- evidence:
  - Implementation subagent reported RED failures before implementation for missing closure helpers and missing Vite context closure.
  - `pnpm --filter @typed/virtual-modules test` passed with 14 files and 156 tests.
  - `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin` passed with 35 files, 448 tests, and no type errors.
  - `git diff --check` passed over T2 owner files.
  - Spec review requested required build-context closure and direct fallback tests; both were fixed and re-reviewed as approved.
  - Code-quality review approved with a residual non-blocking note that stale-artifact invalidation currently proves build-context fingerprinting rather than isolating the closure field alone.
- outcome: shared closure semantics are in core; Vite derives and fingerprints closure for non-dev contexts; dev all-output mode is preserved.
