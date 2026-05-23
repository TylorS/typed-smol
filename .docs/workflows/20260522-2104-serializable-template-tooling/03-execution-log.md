## Execution Summary

Execution is proceeding milestone-by-milestone from `plan.md`.

## Task Records

### Task M1 - Shared Diagnostics Substrate

- task_id: M1
- requirement_ids: FR-01, NFR-01, NFR-05
- ts_scenarios: TS-01, TS-08 partial substrate only
- validation_evidence:
  - initial red: `pnpm --filter @typed/compiler test -- diagnostics` failed because `./diagnostics.js` did not exist.
  - green: `pnpm --filter @typed/compiler test -- diagnostics` passed, 16 files / 62 tests.
  - green: `pnpm --filter @typed/compiler test` passed, 16 files / 62 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `git diff --check` for touched files passed.
  - `ReadLints` was required by the local execution rule, but no such callable tool is available in this environment; package tests/build were used for this slice.
- commit: current atomic commit `feat(compiler): add shared diagnostic substrate`
- deviations_or_replans:
  - Direct execution used. Repository policy prefers subagents for broad substantial work, but the available subagent tool is restricted to explicit user-requested delegation.
- context_updates: none yet
- memory_updates:
  - captured M1 substrate notes in `memory/inbox.md`.
  - recorded completed episode in `memory/episodes.md`.
  - recorded promotion candidate for final diagnostic model.

## Deferred Work

- Route/template diagnostic migration is deferred until host-neutral diagnostic substrate is needed by dependent M5/M8 work.

### Task M2 - Extensible `vmc` Framework Hooks

- task_id: M2
- requirement_ids: FR-04, FR-05, NFR-03, NFR-05
- ts_scenarios: TS-05, TS-10 partial
- validation_evidence:
  - initial red: `pnpm --filter @typed/virtual-modules-compiler test -- extensions` failed because extension transforms/diagnostics were ignored.
  - green: `pnpm --filter @typed/virtual-modules-compiler test -- extensions` passed, 3 files / 20 tests.
  - green: `pnpm --filter @typed/virtual-modules-compiler exec tsc --noEmit` passed.
  - green: `pnpm --filter @typed/virtual-modules-compiler test` passed, 3 files / 20 tests.
  - green: `git diff --check` for touched M2 files passed.
- commit: `a91a674 feat(vmc): add compiler extension hooks`
- deviations_or_replans:
  - First M2 slice focuses on compile/build/watch extension seams and compile-path tests. Full virtual-module compatibility suites remain required before closing M2.
- context_updates: exported extension API from `@typed/virtual-modules-compiler`.
- memory_updates:
  - recorded vmc extension seam in `memory/episodes.md`.
  - added vmc extension API shape as a promotion candidate.

### Task M3 - `@typed/app` Serialization API

- task_id: M3
- requirement_ids: FR-02, FR-03, NFR-02, NFR-05
- ts_scenarios: TS-02
- validation_evidence:
  - initial red: `pnpm --filter @typed/app test -- Serializable` failed because `./Serializable.js` did not exist.
  - green: `pnpm --filter @typed/app test -- Serializable` passed, 26 files / 356 tests.
  - green: `pnpm --filter @typed/app exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/app build` passed.
- commit: current atomic commit `feat(app): add serializable descriptors`
- deviations_or_replans:
  - `@typed/app` owns descriptor constructors and generated descriptor metadata only. Compiler-only schema-planning details remain deferred to M4.
  - Vitest's `Serializable` filter still imported the wider app suite due package typecheck configuration; treated as stronger focused-package coverage.
- context_updates: exported `Serializable` from `@typed/app`.
- memory_updates:
  - recorded serialization descriptor API in `memory/episodes.md`.
  - added generated descriptor placeholder as a promotion candidate.

### Task M4 - Type-Directed Schema Generation

- task_id: M4
- requirement_ids: FR-03, FR-04, NFR-02, NFR-04, NFR-05
- ts_scenarios: TS-03, TS-04
- validation_evidence:
  - initial red: `pnpm --filter @typed/compiler test -- schemaPlan` failed because `./schemaPlan.js` did not exist.
  - second red: `pnpm --filter @typed/compiler test -- schemaPlan` failed because `emitSerializableDescriptorSource` was not implemented.
  - green: `pnpm --filter @typed/compiler test -- schemaPlan` passed, 17 files / 67 tests.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm exec oxlint packages/compiler/src/schema/schemaPlan.ts packages/compiler/src/schema/schemaPlan.test.ts packages/compiler/src/index.ts` passed.
- commit: `2559966 feat(compiler): add schema planning`
- deviations_or_replans:
  - Schema planning starts from the existing `@typed/virtual-modules` `TypeNode` boundary.
  - The generated descriptor emitter references `@typed/app` public metadata and does not expose compiler plan internals to runtime descriptors.
- context_updates: exported schema planning and descriptor-source emitter from `@typed/compiler`.
- memory_updates:
  - recorded TypeNode-to-schema-plan boundary in `memory/episodes.md`.
  - added schema-plan fingerprinting as a promotion candidate.

### Review Fix - M2/M3/M4 Hardening

- task_id: review-fix-001
- requirement_ids: FR-02, FR-03, FR-04, FR-05, NFR-02, NFR-03, NFR-05
- validation_evidence:
  - initial red: `pnpm --filter @typed/virtual-modules-compiler test -- extensions` failed because build mode returned `0` for extension error diagnostics and source transform wrappers stacked.
  - initial red: watch diagnostic regression test failed before `runWatch` reported extension diagnostics.
  - initial red: `pnpm --filter @typed/compiler test -- schemaPlan` failed before generated descriptor source included the schema plan root and bigint literal planning was corrected.
  - green: `pnpm --filter @typed/virtual-modules-compiler test` passed, 3 files / 23 tests.
  - green: `pnpm --filter @typed/compiler test -- schemaPlan` passed, 17 files / 68 tests.
  - green: `pnpm --filter @typed/app test -- Serializable` passed, 27 files / 363 tests.
  - green: `pnpm --filter @typed/virtual-modules-compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/app exec tsc --noEmit --pretty false` passed.
  - green: focused `pnpm exec oxlint ...` over touched files passed.
  - green: `git diff --check` for touched files passed.
- commit: `ba3a0f1 fix(compiler): harden extension diagnostics`
- fixes:
  - Build mode now returns non-zero when extension diagnostics include errors.
  - Watch mode now reports extension diagnostics.
  - Source transform host attachment is idempotent and updates context without stacking wrappers.
  - Generated serializable descriptor source now includes the plan root.
  - Bigint literal planning preserves bigint values and fingerprints them deterministically.
- memory_updates:
  - recorded extension diagnostic fail-closed behavior in `memory/episodes.md`.

### Task M5 - Template Module Analysis And Direct Transform Core

- task_id: M5
- requirement_ids: FR-01, FR-07, FR-09, NFR-01, NFR-04, NFR-05
- ts_scenarios: TS-07, TS-08
- validation_evidence:
  - initial red: `pnpm --filter @typed/compiler test -- analyzeTemplateModule` failed because `./analyzeTemplateModule.js` did not exist.
  - green: `pnpm --filter @typed/compiler test -- analyzeTemplateModule` passed, 18 files / 71 tests.
  - initial red: `pnpm --filter @typed/compiler test -- transformTemplateModule` failed because `./transformTemplateModule.js` did not exist.
  - green: `pnpm --filter @typed/compiler test -- transformTemplateModule` passed, 19 files / 74 tests.
  - green: `pnpm --filter @typed/compiler test -- template` passed, 19 files / 74 tests.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: focused `pnpm exec oxlint ...` over touched compiler files passed.
  - green: `git diff --check` passed.
- commit: current atomic commit `feat(compiler): add template module transforms`
- deviations_or_replans:
  - The first transform core preserves runtime behavior by rewriting `html\`...\`` to `html(hoistedTemplateStrings, ...values)` and attaching the generated `TemplatePlan` to the hoisted template object.
  - Vite/build-mode optimized rendering can consume the hoisted metadata in later milestones without forcing this slice to change the `@typed/template` runtime contract.
- context_updates: exported `analyzeTemplateModule` and `transformTemplateModule` from `@typed/compiler`.
- memory_updates:
  - recorded template module analysis and transform boundary in `memory/episodes.md`.
  - added hoisted template-plan metadata as a promotion candidate.

### Task M6 - `@typed/compiler` CLI

- task_id: M6
- requirement_ids: FR-05, FR-06, NFR-01, NFR-03, NFR-05
- ts_scenarios: TS-06, TS-10
- validation_evidence:
  - initial red: `pnpm --filter @typed/virtual-modules-compiler test -- runVmcCli` failed because `./runVmcCli.js` did not exist.
  - initial red: `pnpm --filter @typed/compiler test -- vmcExtension` failed because `./vmcExtension.js` did not exist.
  - green: `pnpm --filter @typed/virtual-modules-compiler test -- runVmcCli` passed, 4 files / 26 tests.
  - green: `pnpm --filter @typed/compiler test -- vmcExtension` passed, 20 files / 76 tests.
  - green: `pnpm --filter @typed/virtual-modules-compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/virtual-modules-compiler test` passed, 4 files / 26 tests.
  - green: `pnpm --filter @typed/compiler test -- vmcExtension transformTemplateModule analyzeTemplateModule` passed, 20 files / 76 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: focused `pnpm exec oxlint ...` over touched CLI/extension files passed.
  - green: `git diff --check` passed.
- commit: current atomic commit `feat(compiler): add compiler cli wrapper`
- deviations_or_replans:
  - Extracted `runVmcCli` into `@typed/virtual-modules-compiler` so `vmc` and `@typed/compiler` share one argument parsing and compile/build/watch path.
  - The first Typed compiler extension installs the M5 template module transform. Serialization diagnostics can extend the same extension surface when schema usage is wired into route/template analysis.
- context_updates:
  - `@typed/compiler` now exposes a `typed-compiler` bin.
  - `@typed/virtual-modules-compiler` exports `runVmcCli`.
- memory_updates:
  - recorded the reusable CLI runner and Typed compiler extension in `memory/episodes.md`.

### Task M7 - Template Vite Plugin And `@typed/vite-plugin`

- task_id: M7
- requirement_ids: FR-07, FR-08, NFR-01, NFR-03, NFR-05
- ts_scenarios: TS-07, TS-10
- validation_evidence:
  - initial red: `pnpm --filter @typed/compiler test -- templateVitePlugin` failed because `./templateVitePlugin.js` did not exist.
  - initial red: `pnpm --filter @typed/vite-plugin test -- index` failed because `typedVitePlugin()` did not register the template transform before `virtual-modules`.
  - green: `pnpm --filter @typed/compiler test -- templateVitePlugin` passed, 21 files / 80 tests.
  - green: `pnpm --filter @typed/vite-plugin test -- index` passed, 1 file / 16 tests.
  - green: `pnpm --filter @typed/compiler test -- vite templateVitePlugin` passed, 21 files / 80 tests.
  - green: `pnpm --filter @typed/vite-plugin test` passed, 1 file / 16 tests.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/vite-plugin exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm --filter @typed/vite-plugin build` passed.
  - green: focused `pnpm exec oxlint ...` over touched compiler/vite-plugin files passed.
  - green: `git diff --check` passed.
- commit: current atomic commit `feat(vite): add template transform plugin`
- deviations_or_replans:
  - Used the Vite transform hook directly with `enforce: "pre"` so template transforms run before virtual module resolution.
  - `@typed/vite-plugin` now builds `@typed/compiler` before tests because package exports resolve through compiler `dist`.
- context_updates:
  - `@typed/compiler` exports `typedTemplateVitePlugin`.
  - `@typed/vite-plugin` accepts `templates: false | TypedTemplateVitePluginOptions`.
- memory_updates:
  - recorded the Vite template transform boundary in `memory/episodes.md`.

### Task M8 - Template TS Plugin Diagnostics

- task_id: M8
- requirement_ids: FR-01, FR-04, FR-09, NFR-01, NFR-05
- ts_scenarios: TS-08, TS-10
- validation_evidence:
  - initial red: `pnpm --filter @typed/compiler test -- templateDiagnostics` failed because `./templateDiagnostics.js` did not exist.
  - initial red: `pnpm --filter @typed/virtual-modules-ts-plugin test -- plugin -t "appends typed template semantic diagnostics"` failed because invalid template diagnostics were not appended.
  - green: `pnpm --filter @typed/compiler test -- templateDiagnostics` passed, 22 files / 81 tests.
  - green: `pnpm --filter @typed/virtual-modules-ts-plugin test -- plugin -t "appends typed template semantic diagnostics"` passed, 2 files / 14 tests.
  - green: `pnpm --filter @typed/virtual-modules-ts-plugin test` passed, 2 files / 14 tests.
  - green: `pnpm --filter @typed/compiler test -- templateDiagnostics templateVitePlugin analyzeTemplateModule` passed, 22 files / 81 tests.
  - green: `pnpm --filter @typed/compiler exec tsc --noEmit --pretty false` passed.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm --filter @typed/virtual-modules-ts-plugin build` passed.
  - green: focused `pnpm exec oxlint ...` over touched compiler/TS-plugin files passed.
  - green: `git diff --check` passed.
- commit: current atomic commit `feat(ts-plugin): surface template diagnostics`
- deviations_or_replans:
  - Template diagnostics are appended after the existing virtual module language-service adapter so both diagnostic streams survive.
  - The TS plugin bundles `@typed/compiler` with its CJS output to avoid runtime ESM/CJS loading drift in editor hosts.
- context_updates:
  - `@typed/compiler` exports `getTemplateDiagnostics`.
  - `@typed/virtual-modules-ts-plugin` now depends on `@typed/compiler`.
- memory_updates:
  - recorded the shared compiler diagnostic service and TS plugin semantic diagnostic wrapper in `memory/episodes.md`.

### Task M9 - VS Code Extension Cooperation

- task_id: M9
- requirement_ids: FR-10, NFR-01, NFR-03, NFR-05
- ts_scenarios: TS-09, TS-10
- validation_evidence:
  - initial red: `pnpm --filter @typed/virtual-modules-vscode test -- typescriptPlugin codeActions` failed because `./typescriptPlugin.js` and `./codeActions.js` did not exist.
  - green: `pnpm --filter @typed/virtual-modules-vscode test -- typescriptPlugin codeActions` passed, 5 files / 11 tests.
  - green: `pnpm --filter @typed/virtual-modules-vscode build` passed.
  - green: `pnpm --filter @typed/virtual-modules-vscode test` passed, 5 files / 11 tests.
  - green: `pnpm --filter @typed/virtual-modules-ts-plugin test -- plugin -t "appends typed template semantic diagnostics"` passed, 2 files / 14 tests.
  - green: focused `pnpm exec oxlint ...` over touched VS Code/TS-plugin files passed.
- commit: current atomic commit `feat(vscode): configure typed ts plugin`
- deviations_or_replans:
  - VS Code remains a UX/config layer: template diagnostics still come from `@typed/virtual-modules-ts-plugin`.
  - Code actions are conservative and only produce quick fixes when diagnostics carry encoded compiler fix metadata.
- context_updates:
  - VS Code extension contributes `@typed/virtual-modules-ts-plugin`.
  - VS Code extension configures the TS plugin with template diagnostics enabled.
- memory_updates:
  - recorded VS Code TS-plugin configuration and guarded code action behavior in `memory/episodes.md`.
