# Testing Strategy - Serializable Template Tooling

## Test Type Taxonomy

- unit: shared diagnostics, source-span mapping, TypeNode-to-schema planning, template fact extraction, host adapter conversions.
- integration: `vmc` extension hooks with virtual modules still enabled, `@typed/compiler` CLI wrapping `vmc`, Vite template transform plugin, TS plugin semantic diagnostics.
- e2e: sample app build/typecheck/editor-style fixture proving the same invalid template surfaces equivalent diagnostics in CLI and TS plugin. Browser-level UX is deferred unless code actions are implemented in this tranche.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| --- | --- | --- | --- | --- |
| TS-01 | Shared diagnostic converts to `ts.Diagnostic`, Vite warning/error, and VS Code diagnostic without losing code/message/span. | FR-01, NFR-01, NFR-05 | AC-FR01, AC-NFR01 | yes |
| TS-02 | `@typed/app` user-provided `Serializable.schema(...)` descriptor is preferred over generated schema. | FR-02, FR-03, NFR-02 | AC-FR02, AC-FR03 | yes |
| TS-03 | TypeNode primitive/object/array/tuple/union/record inputs generate deterministic schema plans. | FR-03, NFR-02, NFR-04 | AC-FR03, AC-NFR04 | yes |
| TS-04 | Unsupported TypeNode shapes produce fail-closed diagnostics with source spans. | FR-03, NFR-02 | AC-FR03, AC-NFR02 | yes |
| TS-05 | `vmc` extension hook can add a source transform and diagnostics while existing virtual modules still resolve. | FR-04, FR-05, NFR-03, NFR-05 | AC-FR04, AC-FR05, AC-NFR03 | yes |
| TS-06 | `@typed/compiler` CLI supports `--noEmit`, `--build`, and `--watch` entrypoints through the `vmc` framework. | FR-06, FR-05 | AC-FR06 | yes |
| TS-07 | Vite template plugin directly transforms a user module containing `html` and does not emit a virtual module for the compiled template. | FR-07, FR-08 | AC-FR07, AC-FR08 | yes |
| TS-08 | Invalid template attribute/event/property diagnostics match between CLI and TS plugin fixtures. | FR-01, FR-09, NFR-01 | AC-FR09, AC-NFR01 | yes |
| TS-09 | VS Code extension configures the TS plugin and does not recompute semantic template diagnostics independently. | FR-10, NFR-01 | AC-FR10 | no |
| TS-10 | Existing focused suites for touched virtual-module, app, compiler, and Vite packages remain green. | NFR-03 | AC-NFR03 | yes |

## Coverage Targets

- critical_path_target: 100 percent of blocking TS-* scenarios pass before execution is considered complete.
- code_coverage_target: no global numeric target; add branch/table/property coverage for schema generation supported/rejected shapes.
- validation_hooks:
  - `pnpm --filter @typed/compiler test`
  - `pnpm --filter @typed/app test`
  - `pnpm --filter @typed/vite-plugin test`
  - `pnpm --filter @typed/virtual-modules-compiler test`
  - `pnpm --filter @typed/virtual-modules-ts-plugin test`
  - `pnpm --filter @typed/virtual-modules-vscode build`
  - package builds for each touched package
  - `git diff --check`

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | --- | --- |
| TypeScript Program/LanguageService access | available | Reuse current TypeInfo/session helpers; add framework extension seams. |
| `TypeNode` serialization | available | Add schema-planning layer over existing model. |
| Shared virtual-module diagnostics | partial | Add richer compiler diagnostic model and adapters. |
| `@typed/app` serialization API | missing | Implement before generated schema plans need runtime references. |
| `vmc` extension hooks | missing | Implement before compiler CLI wraps `vmc`. |
| Template source-span mapping | partial | Extend template/module analysis from `TemplateStringsArray` to source-file facts. |
| VS Code code actions | missing | Defer until diagnostics include fix metadata. |

## Acceptance Failure Policy

- If a blocking TS-* scenario fails, loop back to the spec or task implementation before proceeding.
- If diagnostics differ across hosts, treat the shared diagnostic model or adapter as wrong until proven otherwise.
- If type-directed Schema generation would require guessing, emit a diagnostic and defer support.
- If `vmc` extension hooks threaten existing virtual-module behavior, stop and preserve compatibility before adding compiler features.
- If a dependency is incomplete, prioritize the smallest substrate task that unblocks it before feature work.

