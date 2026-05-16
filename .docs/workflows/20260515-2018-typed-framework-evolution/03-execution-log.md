# Execution Log — Typed Framework Evolution

## Execution Summary

Execution follows the approved `plan.md`. The first batch is core-only: T1 through T5 must land before adapter migration.

## Task Records

### T1 — Artifact Identity and Paths

- task_id: T1
- requirement_ids: FR-1, FR-2, FR-12, NFR-6, AC-1
- ts_scenarios: TS-1
- validation_evidence:
  - Red: worker ran `pnpm --filter @typed/virtual-modules test -- ArtifactIdentity`; failed with `TypeError: createVirtualLogicalIdentity is not a function`, `Test Files 1 failed | 8 passed (9)`, `Tests 2 failed | 84 passed (86)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- ArtifactIdentity`; passed with `Test Files 9 passed (9)`, `Tests 87 passed (87)`.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactIdentity.ts packages/virtual-modules/src/internal/ArtifactIdentity.test.ts packages/virtual-modules/src/index.ts`; 0 warnings, 0 errors.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactIdentity.ts packages/virtual-modules/src/internal/ArtifactIdentity.test.ts packages/virtual-modules/src/index.ts`; all matched files use correct format.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - Spec review: approved, no missing requirements or extra scope.
  - Code review: first pass requested safe plugin-segment and portable path-test fixes; re-review approved with no new findings.
- commit: `4bf31d4`
- deviations_or_replans: none
- context_updates: none
- memory_updates: deferred until implementation patterns stabilize

### T2 — Manifest and Project Index Types

- task_id: T2
- requirement_ids: FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, AC-2, AC-3, AC-4
- ts_scenarios: TS-2, TS-3
- validation_evidence:
  - Red: worker ran `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; failed with `TypeError: parseVirtualArtifactManifest is not a function`, `TypeError: createVirtualArtifactIndex is not a function`, `Test Files 1 failed | 9 passed (10)`, `Tests 5 failed | 87 passed (92)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; passed with `Test Files 10 passed (10)`, `Tests 92 passed (92)`.
  - Code review first pass requested nested collection validation for fingerprints, dependency descriptors, messages, and project index optional fields.
  - Regression Red: `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; failed with malformed `debug` metadata accepted as `ok: true`, `Test Files 1 failed | 9 passed (10)`, `Tests 1 failed | 93 passed (94)`.
  - Regression Green: `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; passed with `Test Files 10 passed (10)`, `Tests 94 passed (94)`.
  - Code review second pass requested strict JSON-object validation for `debug.metadata` and cycle-safe JSON guards.
  - JSON Guard Red: `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; failed with `Date` metadata accepted as `ok: true`, `Test Files 1 failed | 9 passed (10)`, `Tests 1 failed | 94 passed (95)`.
  - JSON Guard Green: `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; passed with `Test Files 10 passed (10)`, `Tests 95 passed (95)`.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactManifest.ts packages/virtual-modules/src/internal/ArtifactManifest.test.ts packages/virtual-modules/src/index.ts`; 0 warnings, 0 errors.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactManifest.ts packages/virtual-modules/src/internal/ArtifactManifest.test.ts packages/virtual-modules/src/index.ts`; all matched files use correct format.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - Final code review: approved, no remaining blockers in the scoped files.
- commit: pending
- deviations_or_replans: none
- context_updates: none
- memory_updates: deferred until implementation patterns stabilize

### T3 — Fingerprints

- task_id: T3
- requirement_ids: FR-6, FR-7, FR-8, NFR-1, NFR-2, AC-5, AC-6, AC-7
- ts_scenarios: TS-4
- validation_evidence:
  - Red: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; failed with missing helper exports including `TypeError: createSourceInputFingerprint is not a function`, `TypeError: createPluginModuleFingerprint is not a function`, and `Test Files 1 failed | 10 passed (11)`, `Tests 6 failed | 95 passed (101)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; passed with `Test Files 11 passed (11)`, `Tests 101 passed (101)`.
  - Spec/code review first pass requested collision-resistant JSON normalization, unsupported value fail-closed behavior, and changed-input assertions for each required fingerprint input.
  - Collision Red: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; failed with cyclic config hashed and `{ a: undefined }` colliding with marker-shaped user data, `Test Files 1 failed | 10 passed (11)`, `Tests 2 failed | 101 passed (103)`.
  - Collision Green: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; passed with `Test Files 11 passed (11)`, `Tests 103 passed (103)`.
  - Spec/code review second pass requested `-0` preservation, plugin package-name change coverage, symbol/non-enumerable/accessor rejection, and array side-property rejection.
  - Descriptor Red: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; failed with ignored symbol properties and `-0` colliding with `0`, `Test Files 1 failed | 10 passed (11)`, `Tests 2 failed | 101 passed (103)`.
  - Descriptor Green: `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; passed with `Test Files 11 passed (11)`, `Tests 103 passed (103)`.
  - `pnpm exec oxfmt packages/virtual-modules/src/internal/ArtifactFingerprint.ts packages/virtual-modules/src/internal/ArtifactFingerprint.test.ts packages/virtual-modules/src/index.ts`; formatted touched files.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactFingerprint.ts packages/virtual-modules/src/internal/ArtifactFingerprint.test.ts packages/virtual-modules/src/index.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactFingerprint.ts packages/virtual-modules/src/internal/ArtifactFingerprint.test.ts packages/virtual-modules/src/index.ts`; 0 warnings, 0 errors.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
- commit: pending
- deviations_or_replans: none
- context_updates: none
- memory_updates: deferred until implementation patterns stabilize

### T4 — Artifact Store Core

- task_id: T4
- requirement_ids: FR-3, FR-4, FR-5, FR-6, FR-10, FR-11, NFR-1, NFR-2, NFR-3, NFR-4, NFR-8, AC-2, AC-3, AC-4, AC-5, AC-10, AC-11
- validation_evidence:
  - Red: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; failed with `TypeError: createVirtualArtifactStore is not a function`, `Test Files 1 failed | 11 passed (12)`, `Tests 10 failed | 103 passed (113)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; passed with `Test Files 12 passed (12)`, `Tests 113 passed (113)`.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/index.ts`; 0 warnings, 0 errors.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/index.ts`; all matched files use correct format.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - `pnpm --filter @typed/virtual-modules exec tsc -p tsconfig.json --noEmit`; exit 0.
  - Spec/code review first pass requested per-artifact write serialization, serialized project-index updates, unsafe-empty-fingerprint blocking, and missing-file read-race handling.
  - Lock/Fingerprint Red: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; failed because held artifact/index locks were ignored and omitted fingerprints produced a cache hit, `Test Files 1 failed | 11 passed (12)`, `Tests 3 failed | 113 passed (116)`.
  - Lock/Fingerprint Green: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; passed with `Test Files 12 passed (12)`, `Tests 116 passed (116)`.
  - Code review second pass requested hashless-fingerprint blocking and stale lock recovery.
  - Hash/Stale Lock Red: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; failed because hashless fingerprints returned `fingerprint-mismatch` and stale lock directories timed out, `Test Files 1 failed | 11 passed (12)`, `Tests 2 failed | 116 passed (118)`.
  - Hash/Stale Lock Green: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; passed with `Test Files 12 passed (12)`, `Tests 118 passed (118)`.
  - Code review third pass requested explicit-empty fingerprint blocking and owner-token lock release.
  - Empty/Owner Red: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; failed because explicit empty current fingerprints produced a hit and stale-lock replacement release had no owner check, `Test Files 1 failed | 11 passed (12)`, `Tests 2 failed | 118 passed (120)`.
  - Empty/Owner Green: `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; passed with `Test Files 12 passed (12)`, `Tests 120 passed (120)`.
- commit: pending
- deviations_or_replans:
  - Added `ArtifactStoreFingerprints` export so T6/T8 adapters can pass shared current fingerprint groups without reaching into internal types.
- context_updates:
  - Per-artifact manifest remains the authority; project index read failures are surfaced through `readProjectIndex()` but do not block valid artifact reuse.
  - Normal read paths return miss/invalid states for missing/corrupt/stale artifacts instead of throwing.
- memory_updates: deferred until implementation patterns stabilize

### T5 — Module Specifier Handling

- task_id: T5
- requirement_ids: NFR-7, NFR-9, AC-15
- ts_scenarios: TS-11
- validation_evidence:
  - Red: `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; failed because side-effect import `import "./setup"` remained unchanged, with `Test Files 1 failed | 12 passed (13)`, `Tests 1 failed | 120 passed (121)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; passed with `Test Files 13 passed (13)`, `Tests 121 passed (121)`.
  - `pnpm exec oxfmt packages/virtual-modules/src/internal/materializeVirtualFile.ts packages/virtual-modules/src/internal/materializeVirtualFile.test.ts`; formatted touched files.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/materializeVirtualFile.ts packages/virtual-modules/src/internal/materializeVirtualFile.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/materializeVirtualFile.ts packages/virtual-modules/src/internal/materializeVirtualFile.test.ts`; 0 warnings, 0 errors.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - Code review first pass requested TSX parsing, `import("./type")` type-node rewriting, no-substitution-template dynamic imports, and reduced source-printer churn.
  - Syntax Red: `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; failed because template dynamic imports and import type nodes were unchanged and TSX printed invalidly, `Test Files 1 failed | 12 passed (13)`, `Tests 2 failed | 120 passed (122)`.
  - Syntax Green: `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; passed with `Test Files 13 passed (13)`, `Tests 122 passed (122)`.
- commit: pending
- deviations_or_replans:
  - Used TypeScript parser plus span-based literal replacement for static imports, re-exports, side-effect imports, string-literal dynamic imports, no-substitution-template dynamic imports, and import type nodes instead of extending the regex.
- context_updates:
  - Bare module specifiers remain unchanged; only `./` and `../` static module specifier literals are rewritten relative to the virtual artifact path.
- memory_updates: deferred until implementation patterns stabilize

### T6 — Core Adapter Integration

- task_id: T6
- requirement_ids: FR-8, FR-12, FR-13, NFR-6, NFR-8, AC-1, AC-13, AC-14
- validation_evidence:
  - Routing: subagent implementation followed by controller review and two reviewer subagents because T6 is the first adapter-facing integration slice.
  - Red: `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter`; failed with injected artifact-store tests showing no materialization calls and no surfaced store diagnostics, `Test Files 2 failed | 11 passed (13)`, `Tests 4 failed | 122 passed (126)`.
  - Green: `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter`; passed with `Test Files 13 passed (13)`, `Tests 128 passed (128)`.
  - Review Red: `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter`; failed after reviewer regressions for artifact hit reuse, recoverable invalid rebuild, artifact-backed script names, and nested virtual diagnostics, `Test Files 2 failed | 11 passed (13)`, `Tests 5 failed | 126 passed (131)`.
  - Review Green: `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter`; passed with `Test Files 13 passed (13)`, `Tests 131 passed (131)`.
  - Re-review: spec reviewer approved the cache-hit and recoverable-invalid fixes with no blocking findings.
  - Re-review: code-quality reviewer approved the cache-hit and nested-diagnostic fixes with no blocking findings.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/PluginManager.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/LanguageServiceAdapter.ts packages/virtual-modules/src/types.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/LanguageServiceAdapter.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/PluginManager.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/LanguageServiceAdapter.ts packages/virtual-modules/src/types.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/LanguageServiceAdapter.test.ts`; 0 warnings, 0 errors.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
- commit: deferred by user request
- deviations_or_replans:
  - Kept artifact-store integration opt-in through `artifactStoreFactory`; no-factory adapter behavior is preserved for existing callers.
  - Did not add a default adapter store factory in T6 because defaulting changed existing source-file identity assumptions outside the scoped adapter contract.
- context_updates:
  - Artifact-backed records use the materialized artifact source path and rewritten source text, while plugin `build(id, importer, api)` still receives the original virtual id and effective real importer.
  - Artifact cache hits are read before plugin build when the resolver can provide a plugin name without building, and hit source is served without rematerializing.
  - Recoverable invalid artifacts rebuild and rematerialize instead of failing from cache diagnostics; materialization failures still surface through compiler-host `reportDiagnostic` and language-service semantic diagnostics.
  - Nested virtual import artifact failures are attached to the real importer diagnostics so editor calls against the root file can see them.
- memory_updates: deferred until implementation patterns stabilize

### T7 — vmc Compiler-Host Integration

- task_id: T7
- requirement_ids: FR-9, FR-13, NFR-5, NFR-8, AC-8, AC-10, AC-11, AC-14
- validation_evidence:
  - Red: `pnpm --filter @typed/virtual-modules-compiler test`; failed against existing `dist/cli.js` after adding tests, with `Test Files 1 failed (1)`, `Tests 3 failed | 6 passed (9)`. Failures proved no artifact index was written, restart compile re-entered plugin `build()` instead of hitting cache, and corrupt-cache rebuild had no artifact source to mutate.
  - Green prep: `pnpm --filter @typed/virtual-modules-compiler build`; exit 0, rebuilding `dist/cli.js` for the CLI integration harness.
  - Green: `pnpm --filter @typed/virtual-modules-compiler test`; passed with `Test Files 1 passed (1)`, `Tests 9 passed (9)`.
  - `pnpm --filter @typed/virtual-modules-compiler build`; exit 0.
  - `pnpm exec oxfmt --check packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; 0 warnings, 0 errors.
  - Review Red: spec/code reviewers rejected the first pass because CLI tests depended on stale `dist`, loaded plugin module changes could hit stale artifacts, watch fingerprints were captured once per process, `vmc --build` was not wired, and `vmc --watch --noEmit` exited/crashed before proving watch reuse.
  - Plugin Module Red: `pnpm --filter @typed/virtual-modules-compiler test -- -t "rebuilds generated artifacts when a loaded plugin module changes"` failed with `expected +0 to be 1`, proving a changed `plugin.cjs` implementation reused the old artifact.
  - Loader Metadata Red: `pnpm --filter @typed/virtual-modules test -- -t "builds a plugin-manager resolver from plugin entries"` failed because `pluginModules` metadata was absent from `loadResolverFromVmcConfig()`.
  - SourceFile Version Red: `pnpm --filter @typed/virtual-modules test -- -t "sets virtual source file versions"` failed because virtual `SourceFile.version` was `undefined`.
  - Watch Red: `pnpm --filter @typed/virtual-modules-compiler test -- -t "watch recomputes artifact fingerprints"` first failed because `process.exit(main())` terminated watch after the initial compile, then failed with a stale artifact after the source-input edit still reported `Found 0 errors`.
  - Focused Green: plugin module invalidation, loaded plugin metadata, virtual `SourceFile.version`, watch source-input invalidation, and build-mode artifact writing targeted tests all passed after fixes.
  - `pnpm --filter @typed/virtual-modules test`; passed with `Test Files 13 passed (13)`, `Tests 132 passed (132)`.
  - `pnpm --filter @typed/virtual-modules-compiler test`; passed with `Test Files 1 passed (1)`, `Tests 12 passed (12)`.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - `pnpm --filter @typed/virtual-modules-compiler build`; exit 0.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; 0 warnings, 0 errors.
  - `git diff --check`; exit 0.
  - Re-review Red: spec/code reviewers rejected the second pass because TypeInfo dependency descriptors were not fingerprinted, hot watch records could bypass manifest validation, `vmc --build` could fingerprint a different `vmc.config.ts` than the loaded resolver, transitive loaded-plugin helper modules were not fingerprinted, and plugin build error diagnostics remain non-materialized.
  - Dependency Red: `pnpm --filter @typed/virtual-modules-compiler test -- -t "plugin file dependency changes|plugin helper module changes"` failed with two `expected +0 to be 1` assertions, proving stale hits for an out-of-root `api.file()` input and a `require("./helper.cjs")` plugin dependency.
  - Node Loader Red: `pnpm --filter @typed/virtual-modules test -- -t "records CommonJS helper modules"` failed because `NodeModulePluginLoadSuccess.dependencyPaths` was missing.
  - Dependency Green: `pnpm --filter @typed/virtual-modules test -- -t "records CommonJS helper modules"` passed with `Test Files 13 passed (13)`, `Tests 133 passed (133)`.
  - Dependency Green: `pnpm --filter @typed/virtual-modules-compiler test -- -t "plugin file dependency changes|plugin helper module changes"` passed with `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
  - Watch External Dependency Green: `pnpm --filter @typed/virtual-modules-compiler test -- -t "watch recomputes artifact fingerprints"` passed after using an out-of-root `shape.txt` dependency and a real importer touch to trigger the watch rebuild.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - `pnpm --filter @typed/virtual-modules test`; passed with `Test Files 13 passed (13)`, `Tests 133 passed (133)`.
  - `pnpm --filter @typed/virtual-modules-compiler test`; passed with `Test Files 1 passed (1)`, `Tests 14 passed (14)`.
  - `pnpm --filter @typed/virtual-modules-compiler build`; exit 0.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; 0 warnings, 0 errors.
  - Re-review: spec reviewer approved T7, with failed-build diagnostic-only manifests deferred to a later artifact design/spec update.
  - Re-review Red: code-quality reviewer rejected the third pass because recursive glob dependency fingerprints missed TypeInfoApi's recursive `*.ts` => `**/*.ts` semantics, and watch-mode reloaded fingerprints without reloading CommonJS plugin/helper modules in the same process.
  - Recursive Glob Red: `pnpm --filter @typed/virtual-modules test -- -t "recursive glob dependencies"` failed with `expected 'hit' to be 'invalid'`, proving nested recursive glob inputs were not fingerprinted.
  - Watch Helper Red: `pnpm --filter @typed/virtual-modules-compiler test -- -t "watch reloads loaded plugin helper modules"` failed by timing out waiting for the expected `TS2322`, proving the watch process rebuilt with the old cached plugin helper.
  - Recursive Glob Green: `pnpm --filter @typed/virtual-modules test -- -t "recursive glob dependencies"` passed with `Test Files 13 passed (13)`, `Tests 134 passed (134)`.
  - Watch Helper Green: `pnpm --filter @typed/virtual-modules-compiler test -- -t "watch recomputes artifact fingerprints|watch reloads loaded plugin helper modules"` passed with `Test Files 1 passed (1)`, `Tests 15 passed (15)`.
  - `pnpm --filter @typed/virtual-modules test`; passed with `Test Files 13 passed (13)`, `Tests 134 passed (134)`.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - `pnpm --filter @typed/virtual-modules-compiler test`; passed with `Test Files 1 passed (1)`, `Tests 15 passed (15)`.
  - `pnpm --filter @typed/virtual-modules-compiler build`; exit 0.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; 0 warnings, 0 errors.
  - `git diff --check`; exit 0.
  - Re-review Red: final code/spec reviewers rejected the fourth pass because watch still did not rebuild when only plugin/config helper files changed, and recursive glob fingerprints included files TypeInfoApi ignores.
  - TypeInfo Glob Red: `pnpm --filter @typed/virtual-modules test -- -t "ignored by TypeInfo recursive"` failed with `expected 'invalid' to be 'hit'`, proving non-TS files could invalidate artifacts despite not participating in TypeInfoApi directory results.
  - Watch Helper-Only Red: `pnpm --filter @typed/virtual-modules-compiler exec vitest run --passWithNoTests -t "watch reloads loaded plugin helper modules|watch reloads vmc config helper"` failed before fixes when helper-only changes either did not trigger watch or reused stale config/helper state.
  - TypeInfo Glob Green: `pnpm --filter @typed/virtual-modules test -- -t "recursive glob dependencies|ignored by TypeInfo recursive"` passed with `Test Files 13 passed (13)`, `Tests 135 passed (135)`.
  - Watch Helper-Only Green: `pnpm --filter @typed/virtual-modules-compiler exec vitest run --passWithNoTests -t "watch reloads loaded plugin helper modules|watch reloads vmc config helper"` passed with `Test Files 1 passed (1)`, `Tests 2 passed | 14 skipped (16)`.
  - `pnpm --filter @typed/virtual-modules test`; passed with `Test Files 13 passed (13)`, `Tests 135 passed (135)`.
  - `pnpm --filter @typed/virtual-modules build`; exit 0.
  - `pnpm --filter @typed/virtual-modules-compiler test`; passed with `Test Files 1 passed (1)`, `Tests 16 passed (16)`.
  - `pnpm --filter @typed/virtual-modules-compiler build`; exit 0.
  - `pnpm exec oxfmt --check packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcConfigLoader.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; all matched files use correct format.
  - `pnpm exec oxlint packages/virtual-modules/src/internal/ArtifactStore.ts packages/virtual-modules/src/internal/ArtifactStore.test.ts packages/virtual-modules/src/internal/VirtualRecordStore.ts packages/virtual-modules/src/CompilerHostAdapter.ts packages/virtual-modules/src/CompilerHostAdapter.test.ts packages/virtual-modules/src/NodeModulePluginLoader.ts packages/virtual-modules/src/NodeModulePluginLoader.test.ts packages/virtual-modules/src/VmcConfigLoader.ts packages/virtual-modules/src/VmcResolverLoader.ts packages/virtual-modules/src/VmcResolverLoader.test.ts packages/virtual-modules/src/types.ts packages/virtual-modules-compiler/src/artifactStore.ts packages/virtual-modules-compiler/src/build.ts packages/virtual-modules-compiler/src/cli.ts packages/virtual-modules-compiler/src/compile.ts packages/virtual-modules-compiler/src/resolverLoader.ts packages/virtual-modules-compiler/src/watch.ts packages/virtual-modules-compiler/src/cli.integration.test.ts`; 0 warnings, 0 errors.
  - `git diff --check`; exit 0.
  - Final re-review: code-quality reviewer approved recursive glob fingerprint semantics and helper-only watch rebuild/reload coverage, with no findings.
  - Final re-review: spec reviewer approved T7 compliance, with failed-build diagnostic-only manifests still explicitly deferred to a later diagnostic artifact design.
- commit: pending
- deviations_or_replans:
  - Added adjacent `packages/virtual-modules-compiler/src/artifactStore.ts` to share vmc fingerprint and artifact-store construction between compile and watch without duplicating host wiring.
  - Expanded T7 into `packages/virtual-modules/src/VmcResolverLoader.ts` so loaded plugin modules expose resolved paths/plugin names for compiler fingerprinting.
  - Expanded T7 into `packages/virtual-modules/src/CompilerHostAdapter.ts` because TypeScript builder watch programs require virtual `SourceFile.version` on adapter-created source files.
  - Expanded T7 into `packages/virtual-modules/src/internal/ArtifactStore.ts` because manifest validation must recompute `api.file()` / `api.directory()` dependency fingerprints before accepting cache hits.
  - Expanded T7 into `packages/virtual-modules/src/NodeModulePluginLoader.ts` because compiler fingerprints need loaded CommonJS helper module paths, not only the plugin entry file.
  - Wired `vmc --build` through the same artifact-store path instead of documenting it as out of scope.
  - Kept failed plugin-build diagnostic-only manifests deferred; no generated source exists to materialize yet, so this needs a separate diagnostic-artifact design instead of being hidden inside T7.
- context_updates:
  - vmc compile/watch/build now pass `artifactStoreFactory` into `attachCompilerHostAdapter`.
  - vmc artifact reuse fingerprints include source root file hashes, loaded TypeInfo dependency file/glob hashes, the exact loaded `vmc.config.ts` content, loaded plugin entry/helper module hashes, available plugin package versions, resolver/plugin function/config snapshot, TypeScript version, and a normalized parsed command-line snapshot.
  - CLI integration proves restart reuse by making a second process fail if plugin `build()` runs when fingerprints match.
  - Corrupt generated artifact source is treated as recoverable: the next vmc compile rebuilds/rematerializes and exits successfully.
  - Watch mode keeps the compiler-host adapter alive across rebuilds so TypeInfo watch dependencies can mark virtual records stale, while per-rebuild closures refresh type-info sessions and artifact fingerprints.
  - Watch mode marks hot virtual records stale on each rebuild so process-local records re-enter artifact manifest validation instead of bypassing current fingerprints.
  - Recursive `api.directory("*.ts", { recursive: true })` dependency fingerprints mirror TypeInfoApi's direct-plus-nested include expansion.
  - Watch mode reloads the vmc resolver on each rebuild through a stable resolver proxy, and the node plugin loader evicts the cached CommonJS plugin graph before reloading loaded plugin entries.
  - Recursive glob dependency fingerprints now filter to TypeInfoApi's TS-family extensions only.
  - Watch mode installs extra file watchers for loaded vmc config, config helper modules, plugin entry files, and plugin helper modules; helper-only changes invalidate virtual records, reload config/plugins, and trigger a watch rebuild without touching project TS roots.
- memory_updates: `.docs/workflows/20260515-2018-typed-framework-evolution/memories.md`

## Deferred Work

- Adapter migration starts only after T1 through T5 are committed and passing.
