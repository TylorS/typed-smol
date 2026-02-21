## Test Type Taxonomy

- unit:
  - plugin contract validation
  - first-match selection logic
  - unresolved behavior
  - type snapshot serialization shape
  - relative file-path query resolution from explicit base directories
  - directory `relativeGlobs` behavior in recursive and non-recursive modes
  - dependency descriptor registration for watch targets
  - filesystem loader resolution/normalization
- integration:
  - Language Service adapter + plugin manager end-to-end resolution, validated with `@manuth/typescript-languageservice-tester`
  - watch-driven invalidation/recomputation after file and directory changes
  - Compiler-host adapter (`resolveModuleNameLiterals`/`resolveModuleNames`, `getSourceFile`, `fileExists`, `readFile`) with virtual module injection
- e2e:
  - N/A for v1 package-level scope (covered by integration scenarios and future example app coverage)

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| --- | --- | --- | --- | --- |
| TS-1 | First-match plugin selection resolves only first matching plugin and invokes `build` once | FR-1, FR-2, FR-6, NFR-1 | AC-1, AC-6 | yes |
| TS-2 | No matching plugin yields unresolved result and adapter fallback path | FR-2, FR-7, NFR-6 | AC-2 | yes |
| TS-3 | Rich type snapshot returns structural `kind` data for union/intersection/object/array/tuple/function/reference nodes with nested details | FR-3, FR-11, NFR-2, NFR-9 | AC-3, AC-11 | yes |
| TS-4 | Language Service adapter patching makes virtual modules discoverable through module resolution and diagnostics in tsserver-backed tests | FR-4, NFR-1 | AC-4 | yes |
| TS-5 | Compiler-host adapter supports type-check-only flow with virtual module diagnostics | FR-5, NFR-1, NFR-6 | AC-5 | yes |
| TS-6 | Node module resolution loads plugin package from base path and normalizes export shape | FR-8, FR-9, FR-10, NFR-7, NFR-8 | AC-8, AC-9 | yes |
| TS-7 | Invalid/unresolvable filesystem plugin returns deterministic structured error | FR-8, FR-10, NFR-7, NFR-8 | AC-10 | yes |
| TS-8 | Cached type snapshot requests avoid redundant extraction in repeated context | NFR-3 | AC-7 | no |
| TS-9 | Relative file query resolves from provided base directory and returns deterministic snapshots | FR-12, NFR-10 | AC-12 | yes |
| TS-10 | Directory `relativeGlobs` query returns deterministic matches, filtered to immediate scope in non-recursive mode and full subtree in recursive mode | FR-13, NFR-10 | AC-13 | yes |
| TS-11 | Watch-enabled file/directory-glob queries produce dependency descriptors and trigger recomputation after matched file changes | FR-14, NFR-11 | AC-14 | yes |
| TS-12 | LS adapter overrides `resolveModuleNameLiterals` (or fallback `resolveModuleNames`) plus `getScriptSnapshot`/`getScriptVersion` so virtual modules resolve and update in editor diagnostics | FR-4, FR-7, FR-14, NFR-4, NFR-11 | AC-4, AC-14 | yes |
| TS-13 | Compiler adapter overrides resolution + source/file APIs and returns unresolved fallback without crash on plugin miss/error | FR-5, FR-7, NFR-6 | AC-2, AC-5 | yes |

## Adapter API Override Verification Matrix

| adapter | api override | verification |
| --- | --- | --- |
| LS | `resolveModuleNameLiterals` / `resolveModuleNames` | imports of virtual IDs map to deterministic virtual file names |
| LS | `getScriptSnapshot`, `getScriptVersion`, `fileExists`, `readFile` | virtual source is served and version changes trigger diagnostics refresh |
| LS | `watchFile`, `watchDirectory` (if host exposes) | file/glob changes mark dependent virtual modules stale |
| Compiler | `resolveModuleNameLiterals` / `resolveModuleNames` | program resolution includes virtual modules before fallback |
| Compiler | `getSourceFile`, `fileExists`, `readFile` | virtual source files are materialized in program graph |
| Compiler | `hasInvalidatedResolutions` (if host supports) | changed dependencies force re-resolution in watch/incremental mode |

## Coverage Targets

- critical_path_target: 100% pass for blocking TS-1 through TS-7 and TS-9 through TS-13 in CI.
- code_coverage_target: >= 90% line coverage for core manager + loader modules.
- validation_hooks:
  - local: `pnpm -r test --filter @typed/virtual-modules`
  - CI: package test step must pass blocking TS-* suite.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | --- | --- |
| `typescript@5.9.x` | ready | none |
| `vitest` | ready | none |
| `@manuth/typescript-languageservice-tester` | incomplete | add as devDependency in `@typed/virtual-modules` and build integration tests around its `LanguageServiceTester` / `TSServer` APIs |
| file-system watcher harness | incomplete | create deterministic watch test utilities (temp workspace + controlled file writes + debounce-safe assertions) |
| Node `createRequire` / resolution behavior | ready | none |
| test fixtures for plugin packages | incomplete | create fixture modules under package test fixtures during execution |
| LS adapter test harness | incomplete | wire `@manuth/typescript-languageservice-tester` fixtures to validate module-resolution patch behavior end-to-end |

## Acceptance Failure Policy

- If any blocking TS-* scenario fails:
  1. Stop task completion.
  2. Record failure evidence and root cause in execution log.
  3. Patch implementation/tests.
  4. Re-run failed scenario and dependent scenarios.
- If a dependency in `deps` is incomplete:
  1. Prioritize dependency unblocking task.
  2. Record unblock action in execution log.
  3. Continue dependent implementation tasks only after readiness is updated.
