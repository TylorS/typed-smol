# Testing Strategy - Virtual Modules Release Slice

## Test Type Taxonomy

- unit: package-local parser, generator, closure, cache, config, compiler-fact, and protocol tests.
- integration: generated-source, artifact-store, Vite, `vmc`, TS plugin, VS Code, Storybook, and RealWorld tests that cross package boundaries.
- e2e: RealWorld dev/build/preview/HMR/browser acceptance and Storybook/devtools live-smoke flows.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Production import precision for every first-party virtual-module plugin, including conservative all-export fallbacks. | FR-2, FR-3, NFR-2 | AC-2, AC-3 | yes |
| TS-2 | HttpApi client generation exposes only raw Effect client surfaces and preserves endpoint generics and `E/R` channels. | FR-4, FR-5, FR-6, FR-18, NFR-1 | AC-4, AC-5, AC-6 | yes |
| TS-3 | Vite dev, build, and preview resolve the same logical virtual modules with correct dev/all-output and production/pruned-output behavior. | FR-1, FR-17, NFR-3 | AC-1, AC-16 | yes |
| TS-4 | `vmc` and TypeScript plugin consume shared artifact content and invalidate by source/config/plugin/compiler fingerprints. | FR-1, FR-7, FR-9, NFR-3, NFR-4 | AC-1, AC-7, AC-8, AC-16 | yes |
| TS-5 | VS Code virtual tree, preview, and go-to-definition consume shared generated content and keep only presentation caches locally. | FR-7, FR-8, NFR-3, NFR-4 | AC-7, AC-9, AC-16 | yes |
| TS-6 | `typed.config.ts` drives equivalent Vite, Storybook, `vmc`, TS plugin, and VS Code options without duplicated product config. | FR-10, NFR-5 | AC-10 | yes |
| TS-7 | Storybook build, story typecheck, and dev smoke use the same generated app/runtime/client contracts as application surfaces. | FR-11, FR-17, NFR-6 | AC-11, AC-16 | yes |
| TS-8 | Compiler facts cover module discovery, route participation, template dependencies, DevTools correlation, and HMR accept/reject decisions. | FR-13, FR-14, FR-16, NFR-7 | AC-13, AC-14 | yes |
| TS-9 | Template compiler emits server HTML and DOM output that meets the approved optimization threshold. | FR-15, NFR-7 | AC-15 | yes |
| TS-10 | DevTools proves one live runtime/compiler-to-panel vertical slice and unavailable states for unwired capabilities. | FR-12, FR-16, NFR-8 | AC-12 | yes |
| TS-11 | RealWorld passes targeted typecheck, dev/build/preview, HMR, Storybook, and browser acceptance gates. | FR-1, FR-17, NFR-6, NFR-9 | AC-1, AC-6, AC-11, AC-16 | yes |
| TS-12 | Root final gates pass without relying on stale generated artifacts. | FR-1, FR-18, NFR-9 | AC-16 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking `TS-*` scenarios must pass before finalization.
- code_coverage_target: package-specific coverage is secondary to critical-path scenario proof; add coverage only where it catches a real regression class.
- validation_hooks:
  - `git diff --check`
  - targeted package tests for changed packages
  - generated-source/artifact scans for removed wrapper names
  - Storybook build/typecheck/dev smoke
  - RealWorld dev/build/preview/HMR/browser acceptance gates
  - `pnpm build` as the strongest final local gate

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| Shared artifact store | ready but needs VS Code parity proof | Add VS Code/TS plugin shared-content tests. |
| Requested-export analyzer | ready but needs plugin-wide closure contract | Add shared closure API and plugin conformance tests. |
| HttpApi raw client generator | partial | Remove wrapper exports and add type-level channel tests. |
| TypeInfo route/app graph reachability | partial | Define graph facts used by production closure and HMR. |
| Compiler template output | partial | Define concrete optimization threshold before execution task. |
| TS plugin instrumentation | partial | Add counters/timing hooks around hot paths. |
| VS Code presentation cache | partial | Prove shared artifact fingerprints drive refresh. |
| Storybook runtime surface | partial | Replace fixture-only proof with generated app/runtime/client gates. |
| DevTools live bridge | partial | Prove one live runtime/compiler panel slice. |
| RealWorld acceptance | partial | Select exact scripts during planning and keep stale artifact scans. |

## Acceptance Failure Policy

If any blocking `TS-*` scenario fails, execution loops back to the task that owns the mapped FR/NFR and AC. If a dependency is marked partial when its scenario becomes active, the plan must prioritize the unblock action before feature work that relies on it. Stale generated artifacts are treated as failed evidence, not as ignorable local state.
