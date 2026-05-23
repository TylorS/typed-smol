# Testing Strategy — Storybook Framework Integration

Status: approved on 2026-05-22.

## Test Type Taxonomy

- unit:
  - Package export maps and framework option normalization.
  - Vite config composition and `typedVitePlugin()` insertion.
  - Runtime harness pure configuration mapping.
  - Renderer lifecycle teardown behavior.
- integration:
  - Storybook framework preset with Vite resolving `typed:*` modules.
  - Plain Typed component/template story renders in Storybook canvas.
  - Server-aware story composes layers, route/request context, and UI.
  - Portable story setup runs story `run()` with Typed annotations.
- e2e:
  - First tranche includes one fixture-level story/test command that runs UI interaction against real Typed server-side code.
  - Real local HTTP server mode is N/A for the first tranche unless selected later; the initial e2e path may use the in-memory runtime harness.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Package exports expose framework, preset, preview, renderer types, and testing helpers. | FR-1, FR-2 | AC-1 | yes |
| TS-2 | Storybook Vite config includes `typedVitePlugin()` while preserving user `viteFinal`. | FR-3, NFR-6 | AC-2 | yes |
| TS-3 | Plain Typed component/template story renders without server setup. | FR-4 | AC-3 | yes |
| TS-4 | Server-backed fixture story runs UI interaction against real Typed server-side logic. | FR-5, FR-10, NFR-3 | AC-4 | yes |
| TS-5 | Portable story test uses Storybook project annotations, composition, and `run()`. | FR-7, NFR-4 | AC-6 | yes |
| TS-6 | Fixture uses `typed:*` imports without local module shims. | FR-8, NFR-1, NFR-5 | AC-7 | yes |
| TS-7 | Server-story helper types expose router/request/layer behavior without broad public `unknown` channels. | FR-6, FR-9, NFR-1, NFR-2 | AC-8 | yes |
| TS-8 | Old `@typed/storybook` implementation audit is reflected in keep/replace/discard notes. | FR-12 | AC-9 | yes |

## Coverage Targets

- critical_path_target: 100% of TS-1 through TS-8 must pass or be explicitly blocked with an approved loopback.
- code_coverage_target: No global percentage target for the first tranche; prioritize critical behavior tests over broad coverage.
- validation_hooks:
  - package-local unit tests for `@typed/storybook`;
  - fixture portable story test command;
  - fixture Storybook build or dev smoke command if dependency setup supports it;
  - repo typecheck/build gate selected during planning.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| Storybook framework packages | incomplete | Add exact dependency/version plan during implementation planning. |
| Vite builder | ready conceptually | Verify installed version compatibility before code changes. |
| `@typed/vite-plugin` | ready | Use current package integration path. |
| `@typed/app` server/browser virtual modules | ready with risk | Reuse current APIs; loop back if story harness needs a missing runtime boundary. |
| `@typed/ui` and `@typed/template` | ready | Use for minimal story fixtures. |
| Portable story test runner/Vitest | incomplete | Decide package dependencies and setup file in planning. |

## Acceptance Failure Policy

If any TS-* critical path scenario fails during execution, stop the tranche and loop back to specification or planning with the failing evidence. Do not broaden the implementation until the failing critical path is resolved or explicitly descoped by the human.

If a dependency is incomplete, prioritize unblocking the dependency with the smallest verified slice. Do not mask missing framework or compiler support with local fixture shims.
