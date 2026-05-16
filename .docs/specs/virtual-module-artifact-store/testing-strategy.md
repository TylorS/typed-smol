# Testing Strategy — Virtual Module Artifact Store

## Test Type Taxonomy

- unit: artifact identity construction, fingerprint hashing, manifest validation, atomic write helpers, project-index updates, and clean/prune behavior.
- integration: Vite, vmc, TypeScript plugin adapter, and VS Code materialization paths consuming shared core helpers.
- e2e: fixture project exercising dev/build/typecheck/editor-like surfaces across process restarts. Browser interaction is not required for the first tranche unless a Vite dev-server fixture needs module loading proof.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Logical `typed-virtual://` identity maps to deterministic `node_modules/.typed/virtual` source and manifest paths without exposing physical paths to plugin `build()`. | FR-1, FR-2, FR-12, NFR-6 | AC-1 | yes |
| TS-2 | Per-artifact manifest records logical identity, physical source path, generated source hash, dependencies, diagnostics, warnings, and source/config/plugin/compiler fingerprints. | FR-3, FR-5, FR-6, NFR-1, NFR-2 | AC-2, AC-4 | yes |
| TS-3 | Project-level index supports discovery and explicit cleanup while cache validity remains per-artifact. | FR-4, FR-14, NFR-2 | AC-3, AC-12 | yes |
| TS-4 | Source, plugin implementation, plugin config, TypeScript version, and parsed tsconfig changes each invalidate cache reuse. | FR-6, FR-7, FR-8, NFR-1 | AC-5, AC-6, AC-7 | yes |
| TS-5 | Vite and vmc resolve the same virtual module through the shared artifact store and observe a cache hit on unchanged inputs. | FR-9, NFR-5 | AC-8 | yes |
| TS-6 | TypeScript plugin and VS Code integration use shared materialization logic rather than independent normal-case disk preview implementations. | FR-9, NFR-6 | AC-9 | yes |
| TS-7 | Concurrent valid writers use atomic writes; readers never observe partial source or manifest files. | FR-10, NFR-3, NFR-4 | AC-10 | yes |
| TS-8 | Generated artifacts remain reusable across process restarts when fingerprints match. | FR-11, NFR-5 | AC-11 | yes |
| TS-9 | Virtual-to-virtual imports resolve correctly through logical identity and artifact store lookup. | FR-12 | AC-13 | yes |
| TS-10 | Plugin failures, corrupt manifests, stale artifacts, and missing generated source fail clearly in vmc and at least one dev/editor surface. | FR-13, NFR-8 | AC-14 | yes |
| TS-11 | Generated-source module specifier handling supports static imports, re-exports, side-effect imports, and dynamic imports, or unsupported syntax is explicitly documented. | NFR-7, NFR-9 | AC-15 | yes |
| TS-12 | Explicit cleanup removes generated artifacts and project index, normal resolve/build/typecheck flows do not prune, and cleanup is serialized against materialization. | FR-14, NFR-4, NFR-9 | AC-12 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking TS-* scenarios must pass before higher-level framework plugin implementation proceeds.
- code_coverage_target: No repo-wide numeric target for this tranche; coverage must include every artifact-store branch that can return cache hit, cache miss, invalid manifest, invalid source hash, and diagnostic result.
- validation_hooks:
  - package-level unit tests for `@typed/virtual-modules`
  - integration tests for `@typed/virtual-modules-vite`
  - vmc fixture compile/typecheck test
  - TS plugin fixture test or harness equivalent
  - VS Code materialization unit/integration test around shared core helpers
  - root `pnpm build` wrapper for workspace build, project references, and TS plugin sample plugin builds

## Final Verification Commands

Run package-specific gates in dependency order so compiled `dist` outputs cannot mask stale dependencies:

```sh
pnpm --filter @typed/virtual-modules build
pnpm --filter @typed/virtual-modules test
pnpm --filter @typed/virtual-modules-compiler test
pnpm --filter @typed/virtual-modules-vite test
pnpm --filter @typed/virtual-modules-ts-plugin test
pnpm --filter @typed/virtual-modules-vscode build
pnpm -r run test
pnpm -r build
pnpm build
```

`pnpm build` is stricter than `pnpm -r build` in this repository because the root wrapper also runs `tsc -b tsconfig.build.json` and `@typed/virtual-modules-ts-plugin` sample plugin builds.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| `@typed/virtual-modules` artifact-store implementation | complete | Covered by artifact identity, manifest, fingerprint, artifact-store, adapter, and materialization tests. |
| Vite fixture project | complete | Vite tests prove artifact-store integration and vmc/Vite cache reuse. |
| vmc watch/compile fixture | complete | Compiler tests cover vmc artifact store integration, restart reuse, diagnostics, and watch invalidation. |
| TS plugin fixture | complete | TS plugin tests cover shared artifact reuse, source/config/plugin/compiler fingerprints, stale-record validation, and fail-closed resolver drift. |
| VS Code extension tests | complete for shared materialization | VS Code wrapper tests cover absolute artifact paths and legacy basename fallback through core materialization helpers. Full VS Code artifact-store fingerprint integration remains future work. |
| Multi-process/concurrency harness | complete for deterministic local semantics | Artifact-store tests cover artifact/index locks, stale lock recovery, atomic last-writer behavior, and cleanup/materialization serialization. |

## Acceptance Failure Policy

If any blocking TS-* scenario fails during execution, stop higher-level framework plugin work and loop back to the artifact-store implementation or spec. If a dependency is incomplete, prioritize the unblock action before claiming the tranche is complete.

As of T13 in `.docs/workflows/20260515-2018-typed-framework-evolution/03-execution-log.md`, all blocking artifact-store scenarios have passing local package-level and workspace-level verification. Future higher-level framework plugin work should keep these gates green before changing core compiler interfaces.
