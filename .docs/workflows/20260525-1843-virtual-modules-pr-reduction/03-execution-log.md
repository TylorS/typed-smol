# Execution Log

## Execution Summary

- status: in progress
- approved_plan_commit: `58ebf8a`
- execution_mode: subagent-driven development with per-task TDD and review gates

## Task Records

### T0 Baseline and ownership scan

- task_id: T0
- requirement_ids: NFR-9, AC-16
- ts_scenarios: none directly; prepares TS-1 through TS-12 by establishing artifact and dirty-worktree baseline
- validation_evidence:
  - `git status --short --branch` showed branch `codex/typed-beta` ahead of origin with unrelated dirty files.
  - Wrapper-name source/docs scan found hits in T1-owned files:
    - `packages/app/src/internal/emitHttpApiSource.ts`
    - `packages/app/src/HttpApiVirtualModulePlugin.ts`
    - `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
    - `packages/app/src/internal/emitStorybookSource.ts`
    - `packages/app/src/StorybookVirtualModulePlugin.test.ts`
    - `examples/realworld/src/Home.stories.ts`
  - `examples/realworld/node_modules/.typed/virtual` exists and contains banned wrapper names in generated HttpApi and Storybook virtual modules.
  - Focused dirty-path check found no direct dirty-file conflict on exact T1 owner paths.
- commit: `bee1530` - `docs: record virtual modules execution baseline`
- deviations_or_replans:
  - Adjacent dirty RealWorld files may affect T1 validation, especially `examples/realworld/src/Api.ts`.
  - Proceed to T1 only within exact T1 owner paths unless broader RealWorld edits become necessary.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T1 Raw HttpApi client cleanup

- task_id: T1
- requirement_ids: FR-4, FR-5, FR-6, FR-11, FR-17, FR-18, NFR-1, AC-4, AC-5, AC-6
- ts_scenarios: TS-2, TS-7, TS-11, TS-12 partial
- validation_evidence:
  - RED: `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin StorybookVirtualModulePlugin` failed before implementation with expected generated-client and Storybook snapshot failures.
  - GREEN: `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin StorybookVirtualModulePlugin` passed with 35 files, 448 tests, and no type errors.
  - `pnpm --filter @typed/app build` passed.
  - `rm -rf examples/realworld/node_modules/.typed/virtual && pnpm --filter typed-realworld typecheck:stories` passed and rebuilt Storybook successfully.
  - Source banned-name scan over `packages/app/src` and `examples/realworld/src/Home.stories.ts` found no `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, or `OptionalEndpoint` matches.
  - Regenerated artifact banned-name scan over `examples/realworld/node_modules/.typed/virtual` found no matches.
  - `git diff --check` over T1 owner files passed.
- commit: `8687cfd` - `fix(app): remove generated typed http clients`
- deviations_or_replans:
  - Code-quality review found no-API Storybook runtime fallback exported only `makeClient`; fixed by adding `makeClientWith`.
  - Follow-up code-quality review found fallback signatures did not match API-backed runtime helpers; fixed by adding compatible raw helper call signatures and a test.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T2 Production closure core contract

- task_id: T2
- requirement_ids: FR-2, FR-3, NFR-2, AC-2, AC-3
- ts_scenarios: TS-3, TS-4 partial, TS-5 partial
- validation_evidence:
  - RED: implementation subagent reported core tests first failed because shared closure helpers were missing, and Vite tests first failed because build context lacked `closure`.
  - GREEN: `pnpm --filter @typed/virtual-modules test` passed with 14 files and 156 tests.
  - GREEN: `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - GREEN: `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin` passed with 35 files, 448 tests, and no type errors.
  - `git diff --check` over T2 owner files passed.
  - Spec compliance review requested required `VirtualModuleBuildContext.closure` and direct Vite fallback tests for missing importer source and virtual importer source; both were fixed and re-reviewed as approved.
  - Code-quality review approved with one residual non-blocking test precision gap: stale-artifact invalidation proves build-context fingerprinting, but does not isolate `closure` alone.
- commit: `bf4801f` - `feat(virtual-modules): add production dependency closure context`
- deviations_or_replans:
  - Added `packages/virtual-modules-vite/vitest.config.ts` so Vite package tests resolve `@typed/virtual-modules` to workspace source instead of stale `dist`.
  - Kept closure graph fields empty in T2; T3 and T6 fill plugin-declared, TypeInfo, route, and app reachability.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T3a First-party plugin pruning: router, Storybook, env, config, html

- task_id: T3a
- parent_task_id: T3
- requirement_ids: FR-1, FR-2, FR-3, NFR-2, AC-1, AC-2, AC-3
- ts_scenarios: TS-3, TS-4 partial, TS-5 partial, TS-7 partial
- validation_evidence:
  - RED: `pnpm --filter @typed/app exec vitest run src/StorybookVirtualModulePlugin.test.ts src/HtmlVirtualModulePlugin.test.ts` failed before the spec-review fixes on Storybook multi-API `makeClient`, Storybook `DependenciesLayer`, and html `renderHtml`-only pruning.
  - RED: `pnpm --filter @typed/app exec vitest run src/StorybookVirtualModulePlugin.test.ts` failed before the code-quality fixes on single-route/no-route `Routes` output and no-API `makeClient` output.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/StorybookVirtualModulePlugin.test.ts` passed with 1 file, 12 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/RouterVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts src/EnvVirtualModulePlugin.test.ts src/ConfigVirtualModulePlugin.test.ts src/HtmlVirtualModulePlugin.test.ts` passed with 5 files, 130 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - GREEN: `pnpm --filter @typed/app test` passed with 35 files, 463 tests, and no type errors.
  - `git diff --check` over T3a owner files passed.
  - Spec compliance re-review approved with no findings.
  - Code-quality re-review approved with no findings.
- commit: `66a01eb` - `feat(app): prune production virtual module outputs`
- deviations_or_replans:
  - T3 was split because more than two plugin families need pruning rewrites. T3a covers router, Storybook, env, config, and html only.
  - Remaining plugin families are deferred to T3b: HttpApi, composable plugin modules, component, browser/server, and route-handler/plugin families.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T3b1 First-party plugin pruning: directory composable modules

- task_id: T3b1
- parent_task_id: T3
- requirement_ids: FR-1, FR-2, FR-3, NFR-2, AC-1, AC-2, AC-3
- ts_scenarios: TS-3, TS-4 partial, TS-5 partial
- validation_evidence:
  - RED: implementation subagent reported `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` failed with 5 expected pruning failures before implementation.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` passed with 1 file, 25 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/RouterVirtualModulePlugin.test.ts src/TypedVirtualModulePlugins.test.ts` passed with 2 files, 107 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - GREEN: `pnpm --filter @typed/app test` passed with 35 files, 469 tests, and no type errors.
  - `git diff --check` over T3b1 owner files passed.
  - Spec compliance review approved with no findings.
  - Code-quality review approved with no findings.
- commit: `5c1ddd1` - `feat(app): prune composable virtual module outputs`
- deviations_or_replans:
  - T3b1 covers only directory-based composable modules. Path plugins `typed:route-template` and `typed:api-handler` remain unchanged.
  - T3b2 remains for HttpApi, component, browser/server, route-handler, and path-based composable plugin families.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T3b2a First-party plugin pruning: HttpApi production client-safe output

- task_id: T3b2a
- parent_task_id: T3
- requirement_ids: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-18, NFR-1, NFR-2, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- ts_scenarios: TS-2, TS-3, TS-4 partial, TS-5 partial
- validation_evidence:
  - RED: `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts` failed before implementation on 3 production pruning assertions for `Client`, `makeClient`, and `makeClientWith`.
  - RED: spec review then identified `DependenciesLayer`-only production output still emitted `Api` and imported HttpApi client machinery; new assertions failed on `DependenciesLayer`-only, `Api`-only, and `OpenApi`-only output.
  - RED: code-quality review then identified type-only requested exports were pruned to `export {};`; new `import type { Api }` generated-source test failed with missing `Api`.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts` passed with 1 file, 101 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/HttpApiVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts src/TypedVirtualModulePlugins.test.ts` passed with 3 files, 138 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - GREEN: `pnpm --filter @typed/app test` passed with 35 files, 479 tests, and no type errors.
  - `git diff --check` over T3b2a owner files passed.
  - Banned wrapper-name scan over T3b2a owner files found no `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, or `OptionalEndpoint` matches.
  - Spec compliance re-review approved with no findings.
  - Code-quality re-review approved with no findings.
- commit: `f96ac51` - `feat(app): prune httpapi production client output`
- deviations_or_replans:
  - Explicit `mode=client` remains broad even when production build context is available; only implicit full-mode production partial output prunes.
  - A shared core helper for value-or-type export demand was considered but backed out because app tests resolve `@typed/virtual-modules` through built `dist`; this slice keeps declaration-demand logic local to HttpApi.
  - T3b2a covers only HttpApi. Component, browser/server, route-handler, and path-based composable plugin families remain T3b2b.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

### T3b2b1 First-party plugin pruning: path-based composable modules

- task_id: T3b2b1
- parent_task_id: T3
- requirement_ids: FR-1, FR-2, FR-3, NFR-2, AC-1, AC-2, AC-3
- ts_scenarios: TS-3, TS-4 partial, TS-5 partial
- validation_evidence:
  - RED: `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` failed on 6 new production-pruning assertions for `typed:api-handler` and `typed:route-template`.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts` passed with 1 file, 33 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/TypedVirtualModulePlugins.test.ts src/RouterVirtualModulePlugin.test.ts src/HttpApiVirtualModulePlugin.test.ts` passed with 3 files, 216 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/virtual-modules-vite test` passed with 3 files and 25 tests.
  - GREEN: `pnpm --filter @typed/app test` passed with 35 files, 487 tests, and no type errors.
  - `git diff --check` over T3b2b1 owner files passed.
  - Banned wrapper-name scan over T3b2b1 owner files found no `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, or `OptionalEndpoint` matches.
  - Spec compliance review approved with no findings.
  - Code-quality review approved with no findings after optional API export and route-template concern pruning tests were added.
- commit: `c7bb40f` - `feat(app): prune path composable module outputs`
- deviations_or_replans:
  - Browser/server plugin files remain dirty from other work, so they were not touched.
  - T3b2b1 covers only `typed:api-handler` and `typed:route-template`. Component, route-handler, and browser/server plugin families remain T3b2b2.
- context_updates: none
- memory_updates:
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/inbox.md`
  - `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/episodes.md`

## Deferred Work

- T3b2b2 through T9 remain pending.
