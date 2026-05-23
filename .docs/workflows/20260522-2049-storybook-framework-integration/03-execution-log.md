## Execution Summary

Execution started after approval of `plan.md`.

## Task Records

### Task

- task_id: T-1
- requirement_ids: FR-1, FR-2, AC-1
- ts_scenarios: TS-1
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test` failed because `src/index.ts` did not exist.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - none
- context_updates:
  - Added `packages/storybook/AGENTS.md`.
- memory_updates:
  - Added `memories.md` note for the T-1 red-green package-boundary workflow.

## Deferred Work

- Storybook behavior implementation remains in T-2 through T-6.

### Task

- task_id: T-2
- requirement_ids: FR-1, FR-2, AC-1
- ts_scenarios: TS-1
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test` failed because `defineTypedStorybookConfig`, preset exports, and portable-story helpers were missing.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - Installed `storybook@10.4.1` and `@storybook/builder-vite@10.4.1` for current Storybook v10 type surfaces; avoided `@storybook/types` because the latest published package is still `8.6.14`.
- context_updates:
  - none
- memory_updates:
  - Recorded current Storybook dependency decision in `memories.md`.

### Task

- task_id: T-3
- requirement_ids: FR-3, FR-8, NFR-5, NFR-6, AC-2, AC-7
- ts_scenarios: TS-2, TS-6
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test` failed because `viteFinal` was not exported.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - none
- context_updates:
  - none
- memory_updates:
  - Recorded Vite composition check in `memories.md`.

### Task

- task_id: T-4
- requirement_ids: FR-4, FR-12, AC-3, AC-9
- ts_scenarios: TS-3, TS-8
- validation_evidence:
  - SETUP RED: `pnpm --filter @typed/storybook test` first failed because `happy-dom` was not a package-local dev dependency for renderer DOM tests.
  - RED: `pnpm --filter @typed/storybook test` failed because `renderToCanvas` was not exported from `preview.ts`.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed after making the no-harness Effect requirement boundary explicit.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - T-4 only mounts stories whose Effect requirements can run without an external layer; runtime harness layer composition remains T-5.
- context_updates:
  - Added `happy-dom` as a direct dev dependency because Storybook renderer tests construct a real DOM root.
- memory_updates:
  - Recorded the baseline renderer lifecycle and no-harness boundary in `memories.md`.

### Task

- task_id: T-5
- requirement_ids: FR-5, FR-6, FR-9, NFR-1, NFR-2, NFR-4, AC-4, AC-8
- ts_scenarios: TS-4, TS-7
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test` failed because `defineTypedStoryRuntime` was not exported.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed after moving runtime parameters to `storyContext.parameters`, matching Storybook's render context type.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - First harness boundary supports story-level Effect layers in `parameters.typed.layers`; route/request/API fixtures remain T-6.
- context_updates:
  - Runtime helper is exported from `@typed/storybook` main entrypoint.
- memory_updates:
  - Recorded `storyContext.parameters.typed` as the current runtime harness parameter location.

### Task

- task_id: T-6
- requirement_ids: FR-7, FR-10, NFR-3, NFR-4, AC-4, AC-6, AC-10
- ts_scenarios: TS-4, TS-5
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test` failed because `./fixtures/server-backed.stories.js` was missing.
  - GREEN: `pnpm --filter @typed/storybook test` passed with the composed `ServerBacked` story running via Storybook `composeStory()` and `run()`.
  - GREEN: `pnpm --filter @typed/storybook build` passed after widening `TypedStoryResult` for service-requiring Typed templates and using pipe-style `Effect.map` in the built fixture.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - The fixture proves server-side Effect service execution through runtime layers; route-handler and HttpApi-specific stories remain future hardening after this vertical path.
- context_updates:
  - Added `packages/storybook/src/fixtures/server-backed.stories.ts`.
- memory_updates:
  - Recorded portable-story `composeStory()`/`run()` coverage and fixture typing notes in `memories.md`.

### Task

- task_id: T-7
- requirement_ids: NFR-8, AC-10
- ts_scenarios: n/a
- validation_evidence:
  - DOCS: Added `packages/storybook/README.md` covering framework config, runtime layers, and portable stories.
  - GREEN: `pnpm --filter @typed/storybook test` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - LINT: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - none
- context_updates:
  - Package docs explicitly mark route-handler and HttpApi fixtures as next hardening targets.
- memory_updates:
  - Recorded Storybook package verification commands and README coverage in `memories.md`.

### Task

- task_id: T-8
- requirement_ids: NFR-8, AC-10
- ts_scenarios: n/a
- validation_evidence:
  - FINAL: `pnpm --filter @typed/storybook test` passed with 6 test files and 9 tests.
  - FINAL: `pnpm --filter @typed/storybook build` passed.
  - FINAL: `pnpm exec oxlint packages/storybook` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - Worktree contains unrelated concurrent UI/compiler/template workflow changes outside the Storybook integration scope.
- context_updates:
  - Storybook work completed on `codex/typed-beta`; no separate merge operation was needed because execution happened on the target branch.
- memory_updates:
  - No new durable implementation memory beyond T-7.

### Task

- task_id: T-9
- requirement_ids: FR-3, FR-5, FR-6, FR-8, FR-9, FR-10, NFR-1, NFR-2, NFR-4, NFR-5, NFR-6
- ts_scenarios: TS-2, TS-4, TS-5, TS-6, TS-7
- validation_evidence:
  - RED: `pnpm --filter @typed/app test -- src/internal/frameworkVirtualModuleId.test.ts src/StorybookVirtualModulePlugin.test.ts` failed because `typed:storybook/*` IDs and plugin source generation were missing.
  - RED: `pnpm --filter @typed/storybook test` failed because preview annotations, path-only runtime options, narrowed result typing, fixture exclusion, and generated Storybook runtime use were missing.
  - RED: `pnpm --filter @typed/vite-plugin test -- src/index.test.ts` failed because `typedVitePlugin()` did not register the Storybook VM plugin.
  - GREEN: `pnpm --filter @typed/app test` passed with 27 files, 363 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/storybook test` passed with generated `typed:storybook/runtime?path=/server-backed` parameters in the portable fixture.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - GREEN: `pnpm --filter @typed/vite-plugin test` passed.
  - LINT: `pnpm exec oxlint packages/storybook packages/app packages/vite-plugin` passed with 0 errors and 4 pre-existing warnings in unrelated `packages/app` files.
- commit:
  - pending
- deviations_or_replans:
  - Storybook VMs are implemented in `@typed/app`, matching the route/API VM ownership boundary.
  - Public Storybook runtime options are path-based; the internal router layer still converts `path` to a localhost URL for `TypedRouter.TestRouter`.
  - `testLayers` remain explicit in v1 and are applied after generated/API and story layers.
- context_updates:
  - Added `StorybookVirtualModulePlugin` to `@typed/app` and registered it from `@typed/vite-plugin`.
  - Added `packages/storybook/vitest.config.ts` so portable story tests resolve generated Typed VMs.
- memory_updates:
  - Recorded path-based Storybook VM ownership, generated runtime exports, and dependency override ordering in `memories.md`.

### Task

- task_id: T-10
- requirement_ids: FR-3, FR-5, FR-6, FR-8, FR-9, FR-10, NFR-3, NFR-4, NFR-8, AC-4, AC-6, AC-10
- ts_scenarios: TS-2, TS-4, TS-5, TS-6, TS-7
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook test -- src/portable-story.test.ts src/package-boundary.test.ts src/preset.test.ts` failed until the public-beta fixture used non-escaping `./routes`/`./api` VM paths and `tsconfig.test.json` included fixture sources.
  - RED: Storybook portable tests exposed that generated Storybook runtime layers were composing full API server layers into canvas render, requiring `HttpRouter`; fixed by making browser runtime API imports client-mode only.
  - GREEN: `pnpm --filter @typed/storybook test` passed with 7 files and 21 tests.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - GREEN: `pnpm --filter @typed/storybook storybook:build` passed for `fixtures/public-beta`.
  - GREEN: `pnpm --filter @typed/storybook storybook:dev-smoke` passed; the Storybook proxy returned `{"message":"Default API dependency"}` from the generated Typed HTTP server.
  - GREEN: `pnpm --filter @typed/storybook test:stories` passed with Storybook addon-vitest browser mode, 1 story file, and 3 generated story tests.
  - GREEN: `pnpm --filter @typed/app test` passed with 27 files, 363 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/vite-plugin test` passed with 16 tests.
  - LINT: `pnpm exec oxlint packages/storybook packages/app packages/vite-plugin` passed with 0 errors and 4 pre-existing warnings in unrelated `packages/app` files.
- commit:
  - pending
- deviations_or_replans:
  - The runtime VM now imports API VMs in `mode=client` to keep Storybook browser bundles server-safe; real API execution is provided by the Storybook HTTP-server dev plugin through `typed:server`.
  - Storybook preview annotations are made idempotent and query-versioned because Storybook v10 can include the same framework preview annotation twice for a custom renderer/framework package.
  - Dev server plugin resolves `typed:server?...` from the Storybook/Vite root importer so route/API paths can use VM-safe `./src/routes` and `./src/api`.
- context_updates:
  - Added `packages/storybook/fixtures/public-beta` with route, API, dependency, and story fixtures outside the package publish allowlist.
  - Added HTTP-server framework options and later replaced the Storybook fetch helper with generated `typed:api` client constructors.
  - Added package scripts for static Storybook build, dev smoke, and addon story-test compatibility.
- memory_updates:
  - Recorded public-beta fixture, HTTP proxy smoke, browser-safe API runtime import, and addon-vitest server lifecycle notes in `memories.md`.

### Task

- task_id: T-12
- requirement_ids: FR-5, FR-6, FR-8, FR-9, FR-10, NFR-1, NFR-2, NFR-4, NFR-5, NFR-6
- ts_scenarios: TS-4, TS-5, TS-6, TS-7
- validation_evidence:
  - RED: `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts` failed until client-mode API VMs exported `DependenciesLayer` and Storybook runtime composed `Api0.DependenciesLayer` into generated layers.
  - RED: `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts` failed until literal no-input API endpoints omitted empty params/query schemas and generated `makeTypedClient()` wrappers.
  - GREEN: `pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts src/StorybookVirtualModulePlugin.test.ts` passed with 27 files, 365 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/storybook test:portable` passed with 1 file and 3 tests.
  - GREEN: `pnpm --filter @typed/storybook typecheck:stories`, `test`, and `build` passed after clearing stale `.typed` VMC artifacts.
  - GREEN: `pnpm --filter @typed/storybook storybook:build`, `storybook:dev-smoke`, and `test:stories` passed for the public-beta fixture.
  - GREEN: `pnpm --filter @typed/app test` passed with 27 files, 365 tests, and no type errors.
  - GREEN: `pnpm --filter @typed/vite-plugin test` passed with 16 tests.
  - LINT: `pnpm exec oxlint packages/storybook packages/app packages/vite-plugin` passed with 0 warnings and 0 errors.
- commit:
  - pending
- deviations_or_replans:
  - Browser-safe Storybook runtime composes API `DependenciesLayer` from `typed:api?mode=client`; it still does not import `typed:server` or full API server layers.
  - Raw `makeClient()` remains available; `makeTypedClient()` is a Typed convenience wrapper for no-input endpoints so stories do not need empty `{ params, query }` objects.
  - Server-backed Storybook tests are now explicit through `test:stories`; direct portable story tests are explicit through `test:portable`.
- context_updates:
  - Client-mode API VMs now export dependency metadata, raw client constructors, typed client constructors, and URL builders.
  - Storybook runtime generated layers now include API dependency layers before story-level layers and `testLayers`.
- memory_updates:
  - Recorded generated API client convenience wrapper and Storybook dependency-layer composition notes in `memories.md`.
