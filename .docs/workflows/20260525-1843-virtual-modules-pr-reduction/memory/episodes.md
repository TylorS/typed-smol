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

## T3a - Router, Storybook, env, config, and html production pruning

- objective: make the first split of app-level virtual-module plugins honor production requested exports without relying on bundler tree-shaking.
- evidence:
  - Initial Storybook/html regression tests failed on multi-API `makeClient` output, `DependenciesLayer` output without `apiLayers`, and `renderHtml`-only html output.
  - Final Storybook regression tests failed before the quality fix on single-route/no-route `Routes` output and no-API `makeClient` output.
  - `pnpm --filter @typed/app exec vitest run src/StorybookVirtualModulePlugin.test.ts` passed with 1 file, 12 tests, and no type errors.
  - `pnpm --filter @typed/app exec vitest run src/RouterVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts src/EnvVirtualModulePlugin.test.ts src/ConfigVirtualModulePlugin.test.ts src/HtmlVirtualModulePlugin.test.ts` passed with 5 files, 130 tests, and no type errors.
  - `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - `pnpm --filter @typed/app test` passed with 35 files, 463 tests, and no type errors.
  - Spec compliance and code-quality re-reviews both approved with no findings.
- outcome: committed `66a01eb` (`feat(app): prune production virtual module outputs`); T3b remains for HttpApi, composable modules, component, browser/server, and route-handler/plugin families.

## T3b1 - Directory composable production pruning

- objective: make directory composable virtual modules emit only requested production exports while preserving broad dev/no-context output.
- evidence:
  - Implementation subagent reported `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` failed first with 5 expected pruning failures.
  - `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` passed with 1 file, 25 tests, and no type errors.
  - `pnpm --filter @typed/app exec vitest run src/RouterVirtualModulePlugin.test.ts src/TypedVirtualModulePlugins.test.ts` passed with 2 files, 107 tests, and no type errors.
  - `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - `pnpm --filter @typed/app test` passed with 35 files, 469 tests, and no type errors.
  - Spec compliance and code-quality reviews both approved with no findings.
- outcome: directory composable plugins prune `modules` and concern-map exports through shared request helpers; T3b2 remains for HttpApi, component, browser/server, route-handler, and path-based composable families.

## T3b2a - HttpApi production client-safe pruning

- objective: make HttpApi implicit production partial output emit only requested client-safe exports and concrete dependencies while preserving raw Effect client fidelity.
- evidence:
  - Initial focused HttpApi tests failed before implementation on production `Client`, `makeClient`, and `makeClientWith` pruning.
  - Spec review found `DependenciesLayer`-only output still emitted `Api` and imported client machinery; added failing coverage for `DependenciesLayer`-only, `Api`-only, `OpenApi`-only, and `makeUrlBuilder`.
  - Code-quality review found type-only requested exports were pruned to `export {};`; added failing generated-source coverage for `import type { Api }`.
  - `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts` passed with 1 file, 101 tests, and no type errors.
  - `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts src/TypedVirtualModulePlugins.test.ts` passed with 3 files, 138 tests, and no type errors.
  - `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - `pnpm --filter @typed/app test` passed with 35 files, 479 tests, and no type errors.
  - Spec compliance and code-quality re-reviews both approved with no findings.
- outcome: committed `f96ac51` (`feat(app): prune httpapi production client output`); T3b2b remains for component, browser/server, route-handler, and path-based composable plugin families.
