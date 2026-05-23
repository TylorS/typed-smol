# Plan — Storybook Framework Integration

Status: approved on 2026-05-22.

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Establish package skeleton and Storybook framework exports for `@typed/storybook`. | Approved spec and testing strategy. | medium | FR-1, FR-2, AC-1, TS-1 | Package exports and type entrypoints are test-covered. |
| SG-2 | Wire Storybook Vite preset integration through `typedVitePlugin()`. | SG-1 | high | FR-3, FR-8, NFR-5, NFR-6, AC-2, AC-7, TS-2, TS-6 | Preset tests prove Typed plugin insertion and user `viteFinal` preservation. |
| SG-3 | Implement baseline Typed renderer lifecycle. | SG-1 | medium | FR-4, FR-12, AC-3, AC-9, TS-3, TS-8 | Simple Typed component/template story can render and teardown deterministically. |
| SG-4 | Implement first runtime harness boundary for server-aware stories. | SG-1, SG-2, SG-3 | high | FR-5, FR-6, FR-9, NFR-1, NFR-2, NFR-4, AC-4, AC-8, TS-4, TS-7 | Harness composes story layers, route/request context, and server-side logic without broad public `unknown` channels. |
| SG-5 | Add a minimal fixture app and portable story tests. | SG-2, SG-3, SG-4 | high | FR-7, FR-10, NFR-3, NFR-4, AC-4, AC-6, AC-10, TS-4, TS-5 | Fixture test runs UI interaction against real Typed server-side code. |
| SG-6 | Final verification, docs, and merge readiness. | SG-1 through SG-5 | medium | NFR-8, AC-10 | Focused package tests, fixture tests, and selected repo gates pass or blockers are documented. |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T-1 | direct execution | Approved plan | Add `packages/storybook` manifest, tsconfig, AGENTS, and empty source entrypoints; run package export/unit tests that initially fail before implementation. | Stage only new package files; do not touch unrelated dirty files. | Remove package skeleton if dependency plan is invalid before lockfile changes. |
| T-2 | direct execution | T-1 | Implement `index`, `types`, `preset`, `preview`, and `testing` exports; run package tests for export map and config types. | Keep public API minimal and aligned with Storybook framework package docs. | Revert package source files from this task if export shape conflicts with Storybook. |
| T-3 | direct execution | T-2 | Implement Vite preset composition with `typedVitePlugin()`; test plugin insertion and user `viteFinal` composition. | Do not bypass `@typed/vite-plugin`; no local virtual-module shims. | Back out preset implementation while preserving package skeleton. |
| T-4 | direct execution | T-2 | Implement renderer lifecycle from the old renderer concept using current Typed runtime/template APIs; test mount, error reporting, and teardown. | Keep renderer browser-only; server behavior belongs in harness. | Revert renderer source and tests for this task only. |
| T-5 | direct execution | T-3, T-4 | Implement runtime harness helpers and typed story context; add type-level and unit tests for layer/request/router behavior. | Route Effect module use through owning skills before code edits; avoid broad public `unknown`. | Back out harness helpers while keeping renderer/preset. |
| T-6 | direct execution | T-5 | Add minimal fixture stories and portable story tests; prove no local `declare module "typed:*"` shims. | Use smallest fixture that proves server-backed UI; defer RealWorld fixture. | Remove fixture and test command if dependencies cannot be stabilized. |
| T-7 | direct execution | T-6 | Update package docs and workflow memory; run focused verification commands selected by discovered package scripts. | Record any dependency/version limitations explicitly. | Revert docs/memory updates if implementation scope changes. |
| T-8 | direct execution | T-7 | Final local verification and merge readiness summary for `codex/typed-beta`. | Do not merge if critical TS-* scenarios fail. | Loop back to the failing task and update plan. |

## Active Task Detail — T-1 Package Skeleton

- status: completed
- requirement_links: FR-1, FR-2, AC-1, TS-1
- substeps:
  1. Add `packages/storybook/package.json`, `tsconfig.json`, `AGENTS.md`, and a package-boundary test.
  2. Run `pnpm --filter @typed/storybook test` and confirm the test fails because source entrypoints are missing.
  3. Add minimal empty source entrypoints for `.`, `./preset`, `./preview.js`, `./testing`, and shared types.
  4. Re-run `pnpm --filter @typed/storybook test`.
  5. Run `pnpm --filter @typed/storybook build` for skeleton type/build verification.
  6. Record validation evidence in `03-execution-log.md` and memory notes.

## Active Task Detail — T-2 Public Exports

- status: completed
- requirement_links: FR-1, FR-2, AC-1, TS-1
- substeps:
  1. Add failing public-surface tests for the framework constant, config helper, preset exports, preview annotations, and portable-story testing exports.
  2. Verify `pnpm --filter @typed/storybook test` fails because these exports are missing.
  3. Implement minimal public exports without renderer or Vite behavior beyond package identity.
  4. Re-run `pnpm --filter @typed/storybook test`.
  5. Re-run `pnpm --filter @typed/storybook build` and `pnpm exec oxlint packages/storybook`.

## Active Task Detail — T-3 Vite Preset Composition

- status: completed
- requirement_links: FR-3, FR-8, NFR-5, NFR-6, AC-2, AC-7, TS-2, TS-6
- substeps:
  1. Add a failing preset test proving `viteFinal` preserves existing plugins and appends `typedVitePlugin()` output.
  2. Verify `pnpm --filter @typed/storybook test` fails because `viteFinal` is missing.
  3. Implement minimal `viteFinal` composition using framework options.
  4. Re-run `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.

## Active Task Detail — T-4 Renderer Lifecycle

- status: completed
- requirement_links: FR-4, FR-12, AC-3, AC-9, TS-3, TS-8
- substeps:
  1. Add a failing renderer lifecycle test proving a Typed template story mounts, calls `showMain`, and tears down the canvas.
  2. Verify `pnpm --filter @typed/storybook test` fails because `renderToCanvas` is missing.
  3. Implement `renderToCanvas` through `@typed/app/runtime.mount`.
  4. Re-run `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.

## Active Task Detail — T-5 Runtime Harness Boundary

- status: completed
- requirement_links: FR-5, FR-6, FR-9, NFR-1, NFR-2, NFR-4, AC-4, AC-8, TS-4, TS-7
- substeps:
  1. Add a failing runtime harness test where a story template reads an Effect service provided by story-level runtime layers.
  2. Verify `pnpm --filter @typed/storybook test` fails because the author-facing runtime helper is missing.
  3. Add `defineTypedStoryRuntime()` and apply `storyContext.parameters.typed.layers` during `renderToCanvas`.
  4. Re-run `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.

## Active Task Detail — T-6 Fixture And Portable Stories

- status: completed
- requirement_links: FR-7, FR-10, NFR-3, NFR-4, AC-4, AC-6, AC-10, TS-4, TS-5
- substeps:
  1. Add a failing portable-story test that imports a missing server-backed fixture story.
  2. Verify `pnpm --filter @typed/storybook test` fails because the fixture story does not exist.
  3. Add a minimal server-backed fixture story using `defineTypedStoryRuntime({ layers })`.
  4. Run the composed story through Storybook `composeStory()` and `run()`.
  5. Re-run `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.

## Active Task Detail — T-7 Package Docs And Memory

- status: completed
- requirement_links: NFR-8, AC-10
- substeps:
  1. Add package usage docs for config, runtime layers, and portable stories.
  2. Update workflow memory with durable commands and current implementation boundaries.
  3. Re-run `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.

## Validation Strategy

- First write failing tests per task before implementation when editing code.
- Prefer focused package tests before broader repo gates.
- Required critical checks by final task:
  - `pnpm --filter @typed/storybook test`
  - fixture portable story test command selected during implementation
  - package build/typecheck command selected after package scripts exist
  - any affected `@typed/app`, `@typed/template`, or `@typed/ui` tests if runtime boundaries are touched

## Tactical Replanning Triggers

- Storybook package APIs differ from the researched docs after dependencies are installed.
- `typedVitePlugin()` cannot be composed safely through Storybook `viteFinal`.
- Renderer implementation needs changes in `@typed/template`, `@typed/ui`, or `@typed/app` beyond narrow adapter code.
- Runtime harness type boundaries require broad `unknown` or casts to work.
- Fixture needs local `typed:*` module shims to compile.
- Portable story tests cannot run under the selected Storybook/Vitest dependency set.

When a trigger fires, replan only the affected subgoal unless the product goal changes.

## Mutating-Action Safeguards

- Check `git status --short --branch` before each task commit.
- Stage only files owned by the current task.
- Do not revert unrelated modifications or untracked folders.
- Commit each completed task or coherent subgoal separately.
- Do not install dependencies until the package/dependency plan is clear for that task.

## Memory Plan

- capture:
  - `workflows/20260522-2049-storybook-framework-integration/memories.md` for implementation-specific commands, dependency decisions, test gaps, and gotchas.
- promotion_criteria:
  - Promote only durable framework constraints, verified commands, or recurring failure patterns to `.docs/_meta/memory/`.
  - Do not promote exploratory Storybook API guesses until verified by tests.
- recall_targets:
  - `.docs/specs/storybook-framework-integration/spec.md`
  - `.docs/specs/storybook-framework-integration/testing-strategy.md`
  - `.docs/adrs/20260522-2058-storybook-runtime-harness-first.md`
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260516-1643-vavite-backed-typed-http-server.md`
