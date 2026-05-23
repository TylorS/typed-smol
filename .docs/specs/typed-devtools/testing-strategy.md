# Testing Strategy - Typed DevTools

Status: approved on 2026-05-23 with `spec.md`.

## Test Type Taxonomy

- unit:
  - Protocol schema/codecs, RPC groups, branded ids, redaction, serialization, capability negotiation, fixture builders.
  - Compiler fact planning for component/template/source/HMR metadata.
  - Runtime instrumentation wrappers for `Fx`, `RefSubject`, DOM registry, and Navigation events.
- integration:
  - `typed.config.ts` opt-in through compiler/plugin wiring into a runtime `Layer`.
  - Inspected-page bridge round trips with JSON-compatible protocol summaries.
  - RPC client/server or handler round trips over in-process and browser/dev-server transport adapters.
  - Dev-server/compiler Analyzer bridge requests and unavailable-state behavior.
  - Storybook/protocol fixture rendering without Chrome APIs.
- e2e:
  - Chrome DevTools panel smoke against a local Typed app.
  - Elements node selection resolving to component/template/RefSubject/Fx context.
  - Sources Analyzer sidebar requesting bridge-backed source analysis.
  - Reload/reconnect behavior for inspected page and extension UI.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Protocol package defines typed lanes, ids, codecs, fixtures, and capability negotiation. | FR-1, FR-2, FR-40, NFR-1, NFR-2, NFR-17 | AC-1, AC-11 | yes |
| TS-2 | DevTools instrumentation is disabled by default, enabled through `typed.config.ts`, and available as explicit Layer composition. | FR-5 through FR-10, NFR-13 | AC-2 | yes |
| TS-3 | DOM selection resolves to owning component/template/source plus related RefSubject/Fx ids through compiler/runtime metadata. | FR-11 through FR-18, NFR-7 | AC-3 | yes |
| TS-4 | Fx instrumentation captures component-owned roots, RefSubject-derived streams, and one arbitrary unowned Fx without changing semantics. | FR-19 through FR-22, NFR-3, NFR-11 | AC-4, AC-12 | yes |
| TS-5 | RefSubject inspection records snapshots, updates, version, subscriber count, service id, owner id, redaction, and size limits. | FR-23, FR-24, NFR-4, NFR-6 | AC-5 | yes |
| TS-6 | HMR facts distinguish optimized templates from state-preserving eligibility and expose structured rejection reasons. | FR-25, FR-26 | AC-6 | yes |
| TS-7 | Navigation timeline is populated from `@typed/navigation` and deep-links to correlated component/source ids. | FR-27 | AC-7 | yes |
| TS-8 | OTEL trace payloads preserve trace/span identity and Typed correlation metadata. | FR-28, FR-29 | AC-8 | yes |
| TS-9 | Chrome panel and Elements integration connect to an inspected app, recover from reload, and display JSON summaries. | FR-30, FR-31, FR-38, FR-39, NFR-9, NFR-12 | AC-9 | yes |
| TS-10 | Sources Analyzer requests checker-backed results through the dev-server/compiler bridge and shows unavailable when missing. | FR-32 through FR-37, NFR-8, NFR-14 | AC-10 | yes |
| TS-11 | Compile-time fixtures prove inference-first APIs and reject invalid protocol/bridge payloads without broad casts. | FR-41, FR-42, NFR-15, NFR-16, NFR-17 | AC-13 | yes |
| TS-12 | Shared `effect/unstable/rpc` groups define DevTools communication and run through one in-process/test transport plus one browser/dev-server adapter. | FR-43 through FR-45, NFR-18 | AC-14 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking `TS-*` scenarios must pass before release or phase completion claims.
- code_coverage_target: no global percentage target for the first tranche; require scenario coverage for protocol, compiler, runtime, and Chrome bridge boundaries.
- validation_hooks:
  - package-level unit tests for protocol/compiler/runtime packages;
  - typecheck/type-test commands for public inference contracts;
  - integration fixtures for config opt-in, bridge messages, Analyzer bridge, and Storybook rendering;
  - Playwright or equivalent Chrome-extension smoke for DevTools panel, Elements, and Sources flows;
  - `git diff --check` before commits.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| `@typed/devtools-protocol` package | not started | create package and schema/type-test harness first. |
| `effect/unstable/rpc` protocol definitions | not started | define RPC groups in protocol package before transport-specific adapters. |
| compiler component/template/HMR facts | partial existing support | extend existing compiler facts with stable ids, source spans, template paths, and rejection taxonomy. |
| runtime instrumentation Layer | not started | design Layer service boundary and no-op production behavior before wiring capture. |
| DOM registry | partial template path substrate exists | add dev-only registry around compiled DOM template runtime. |
| Fx arbitrary capture | not started | identify first supported constructors/combinators/runs and semantic-preservation tests. |
| RefSubject capture | partial runtime state exists | add instrumentation hooks and redacted value summaries. |
| dev-server/compiler Analyzer bridge | not started | define request/response protocol and compiler artifact lookup. |
| Chrome extension harness | not started | scaffold only after protocol fixtures exist. |
| Storybook/protocol fixtures | partial Storybook workflow exists | consume protocol fixtures independent of Chrome APIs. |
| OTEL span source | partial `Fx.withSpan` path exists | choose bridge/export path during implementation planning. |

## Acceptance Failure Policy

- If any blocking `TS-*` scenario fails during execution, stop the current task and loop back to the smallest affected requirement/spec/design element.
- If a failure shows instrumentation changed `Fx` or `RefSubject` semantics, treat it as a correctness blocker rather than UI polish.
- If a dependency in the readiness matrix is incomplete, prioritize the unblock action before implementing dependent UI.
- If Chrome extension behavior cannot be automated immediately, require a documented manual smoke with exact app, browser, and interaction steps until automation exists.
- If source Analyzer bridge data is unavailable, verify the unavailable-state path instead of adding browser-only AST approximation.
- If RPC transport adapters fail, fix the adapter or protocol group definition rather than introducing ad-hoc non-RPC message contracts.
