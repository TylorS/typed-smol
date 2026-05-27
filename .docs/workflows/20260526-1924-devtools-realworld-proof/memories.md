# Memories - DevTools RealWorld End-To-End Proof

## T0 - Preflight And Ownership Boundary

- recorded_at: 2026-05-26 20:01:10 EDT
- branch: `codex/typed-beta`
- workspace isolation: normal checkout, not linked worktree (`git_dir == git_common`), no superproject.
- `hurl`: missing. `command -v hurl` exited 1 with no output.

### Baseline Commands

- `pnpm --filter @typed/devtools-protocol test`: passed. Vitest reported 4 files, 25 tests.
- `pnpm --filter @typed/devtools-runtime test`: passed. Vitest reported 9 files, 49 tests.
- `pnpm --filter @typed/devtools-chrome test`: passed. Vitest reported 8 files, 40 tests.

### Existing Dirty Files Not Owned By T0

- `.cursor/hooks/state/continual-learning.json`
- `examples/counter/typed.config.ts`
- `examples/realworld/package.json`
- `examples/realworld/src/Api.ts`
- `examples/realworld/src/application/Comments.ts`
- `examples/realworld/src/common/components/Banner.ts`
- `examples/realworld/src/common/components/CommentForm.ts`
- `examples/realworld/src/common/components/FeedContent.ts`
- `examples/realworld/src/common/components/FeedToggle.ts`
- `examples/realworld/src/tests/package.test.ts`
- `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- `packages/app/src/ServerVirtualModulePlugin.test.ts`
- `packages/app/src/internal/emitHttpApiSource.ts`
- `packages/app/src/internal/emitServerSource.ts`
- `packages/virtual-modules-ts-plugin/package.json`
- `packages/virtual-modules-ts-plugin/src/plugin.ts`
- `packages/virtual-modules-vite/src/vitePlugin.test.ts`
- `packages/virtual-modules-vite/src/vitePlugin.ts`
- `packages/virtual-modules/src/CompilerHostAdapter.test.ts`
- `packages/virtual-modules/src/CompilerHostAdapter.ts`
- `packages/virtual-modules/src/LanguageServiceAdapter.test.ts`
- `packages/virtual-modules/src/LanguageServiceAdapter.ts`
- `packages/virtual-modules/src/internal/VirtualRecordStore.ts`
- `scripts/publish-beta.sh`

### Ownership Notes

- T1 intends to edit `examples/realworld/package.json`, which already has another agent's hunk changing `typecheck:stories` from `pnpm storybook:build` to `vmc --noEmit -p tsconfig.storybook.json && pnpm storybook:build`.
- Preserve existing dirty hunks and stage only workflow-owned changes.
- Reread any overlapping file before editing because concurrent agent work is active in RealWorld, app virtual-module tests, compiler host adapter files, virtual-modules vite plugin files, and publish scripts.

## T1 - RealWorld Devtools Smoke Opt-In

- red_command: `pnpm --filter typed-realworld exec vitest run --passWithNoTests src/tests/presentation/devtools-smoke-mode.test.ts`
- red_result: failed as expected because `src/browser.devtools.ts`, `index.devtools.html`, and `scripts.run-devtools-local.ts` did not exist and `devtools:local` was missing.
- green_command: `pnpm --filter typed-realworld exec vitest run --passWithNoTests src/tests/presentation/devtools-smoke-mode.test.ts`
- green_result: passed. Vitest reported 1 file and 3 tests.
- command_refinement: `pnpm --filter typed-realworld test:ssr -- src/tests/presentation/devtools-smoke-mode.test.ts` runs the whole presentation directory because the package script already includes `src/tests/presentation`; use the focused Vitest command for T1.
- check_command: `pnpm --filter typed-realworld check`
- check_result: blocked outside T1 after T1 formatting was fixed. Remaining errors are `node_modules/.typed/virtual/httpapi-virtual-module/4585439fb101fbc7.ts(87,5611): error TS2304: Cannot find name 'OpenApiModule'.` and formatting in existing dirty `src/common/components/CommentForm.ts`.
- ownership_note: do not fix the `OpenApiModule` or `CommentForm.ts` blockers inside T1 without approval because they overlap concurrent RealWorld and HttpApi virtual-module work.
- later_check_result: after concurrent RealWorld changes and the T4 app bridge/session work, `pnpm --filter typed-realworld check` passed with 0 warnings, 0 errors, and all matched files formatted.

## T2 - Shared Runtime And Bridge Wiring

- status: verified existing implementation; no code change required.
- ownership_check: T2 target files were clean before inspection: `packages/app/src/internal/emitBrowserSource.ts`, `packages/app/src/BrowserVirtualModulePlugin.test.ts`, `packages/app/src/runtime/devtoolsBridge.ts`, `packages/app/src/runtime/devtoolsBridge.test.ts`, `packages/app/src/runtime/domTemplateRuntime.ts`, and `packages/app/src/runtime/domTemplateRuntime.test.ts`.
- evidence: `BrowserVirtualModulePlugin.test.ts` already asserts devtools browser source emits `makeDevtoolsRuntime({ enabled: true })`, `makeDomRegistry({ runtime: devtoolsRuntime })`, `installTypedDevtoolsBridge`, `runtime: devtoolsRuntime`, and `devtools: { enabled: true, domRegistry }`.
- evidence: `devtoolsBridge.test.ts` already proves a wired runtime advertises `components` and `dom`, returns `RuntimeReplayState`, and replays live runtime events from the same runtime event bus.
- evidence: `domTemplateRuntime.test.ts` already proves `createAppDomTemplateRuntime` uses `domRegistry.observer` only when devtools are enabled.
- broad_command: `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin.test.ts runtime/devtoolsBridge.test.ts runtime/domTemplateRuntime.test.ts`
- broad_result: passed but ran the full package because the package script consumes the extra args after its own command shape; Vitest reported 35 files, 499 tests, no type errors, duration 97.20s.
- focused_command: `pnpm --filter @typed/app exec vitest run --passWithNoTests BrowserVirtualModulePlugin.test.ts runtime/devtoolsBridge.test.ts runtime/domTemplateRuntime.test.ts`
- focused_result: passed. Vitest reported 3 files, 18 tests, no type errors, duration 2.42s.

## T3 - Connected Panel Must Not Seed Fixture Rows

- red_command: `pnpm --filter @typed/devtools-chrome exec vitest run --passWithNoTests src/panel/state.test.ts`
- red_result: failed as expected. A connected `Ready` replay with `retainedEvents: 0` preserved stale component rows from previous state, including `Root`.
- fix: `applyReplayState` now resets derived panel rows for every replay boundary, including `Ready`, before replay/live events are applied.
- green_command: `pnpm --filter @typed/devtools-chrome exec vitest run --passWithNoTests src/panel/state.test.ts`
- green_result: passed. Vitest reported 1 file, 6 tests.
- focused_panel_command: `pnpm --filter @typed/devtools-chrome exec vitest run --passWithNoTests src/panel/app.test.ts src/panel/state.test.ts`
- focused_panel_result: passed. Vitest reported 2 files, 12 tests.
- package_command: `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts src/panel/state.test.ts`
- package_result: passed after fixing the unused replay-state parameter. The package script includes typecheck and broadened Vitest to all package tests; Vitest reported 8 files and 41 tests.

## T4 - RealWorld Inspected-Window Harness

- red_command: `pnpm --dir examples/realworld run test:devtools:local`
- red_result: failed with `ERR_PNPM_NO_SCRIPT` because `test:devtools:local` did not exist.
- first_browser_result: after adding the harness, `pnpm --filter typed-realworld test:devtools:local` reached the page bridge and logged `RealWorld DevTools accepted capabilities: components,dom`, but failed because replay state did not include the negotiated session id.
- bridge_red_command: `pnpm --filter @typed/app exec vitest run --passWithNoTests runtime/devtoolsBridge.test.ts`
- bridge_red_result: failed because a runtime with no configured session returned replay state without `sessionId`.
- bridge_fix: `installTypedDevtoolsBridge` now stamps non-disabled replay states with `request.sessionId` when the runtime/event bus did not already provide a session id.
- bridge_green_command: `pnpm --filter @typed/app exec vitest run --passWithNoTests runtime/devtoolsBridge.test.ts`
- bridge_green_result: passed. Vitest reported 1 file, 6 tests, no type errors.
- harness_note: `/` can hang on current Typed SSR during package churn, so the devtools smoke uses Playwright to fulfill a same-origin `/devtools-smoke.html` document and load `/src/browser.devtools.ts` from Vite. Readiness checks `/src/browser.devtools.ts` with a 2s timeout.
- dist_note: RealWorld imports `@typed/app` from package `dist`, so `devtools:local` and `test:devtools:local` run `pnpm --filter @typed/app build` before `vmc` and Playwright.
- green_command: `pnpm --filter typed-realworld test:devtools:local`
- green_result: passed. Playwright reported 1 Chromium test passing and logged `RealWorld DevTools accepted capabilities: components,dom`.
