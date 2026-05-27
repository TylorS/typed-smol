# Testing Strategy - DevTools RealWorld End-To-End Proof

Status: approved on 2026-05-26 after production-grade review.

## Test Type Taxonomy

- unit:
  - generated browser source tests for devtools opt-in/default-disabled behavior;
  - runtime/bridge tests for shared `DevtoolsRuntimeService`, capability negotiation, replay state, and unavailable states;
  - panel-state tests for no fixture-backed rows in connected RealWorld mode.
- integration:
  - RealWorld generated browser runtime with devtools enabled;
  - inspected-window bridge RPC calls against `globalThis.__TYPED_DEVTOOLS__`;
  - DOM binding resolution through mounted compiled templates;
  - Navigation/HMR/RefSubject/Fx/OTEL event replay when each source is wired.
- e2e:
  - local RealWorld devtools smoke against the built Chrome panel or the same panel code running through an equivalent inspected-window harness;
  - route interaction producing Navigation and component rows;
  - HMR local smoke producing structured HMR rows;
  - documented manual smoke if extension automation is blocked.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | RealWorld default build excludes devtools, while smoke mode includes the generated bridge. | FR-1, FR-2, NFR-1, NFR-2, NFR-8 | AC-1 | yes |
| TS-2 | Generated runtime shares one enabled runtime/event bus across DOM registry, bridge, and replay. | FR-2, FR-3, NFR-3 | AC-2 | yes |
| TS-3 | Connected panel or inspected-window smoke reads live RealWorld replay data and no fixture-only runtime rows. | FR-4, FR-5, NFR-6, NFR-7 | AC-3 | yes |
| TS-4 | RealWorld hydration produces component/template mount rows. | FR-6, NFR-8 | AC-4 | yes |
| TS-5 | RealWorld DOM binding resolution reaches component/template ownership. | FR-7, FR-19 | AC-5 | yes |
| TS-6 | Source action resolves compiler/source facts to exact RealWorld source location without fabricated browser analysis. | FR-8, FR-19, NFR-4 | AC-6 | yes |
| TS-7 | RealWorld interaction emits a live Fx graph with required node and edge/no-edge fields. | FR-9, FR-10, FR-21, FR-22, NFR-3 | AC-7 | yes |
| TS-8 | RealWorld interaction emits RefSubject snapshot and update rows with required state fields. | FR-11, FR-12, FR-21, FR-25 | AC-8 | yes |
| TS-9 | RealWorld HMR proof keeps template optimization separate from stateful status and rejection reasons. | FR-13, FR-14 | AC-9 | yes |
| TS-10 | Real route transitions produce Navigation rows with type and destination. | FR-15, FR-16 | AC-10 | yes |
| TS-11 | OTEL rows render RealWorld trace/span identity, timing, status, attributes summary, and Typed correlations. | FR-17, FR-18, FR-21, FR-28 | AC-11 | yes |
| TS-12 | Local proof documentation lists commands, ports, browser setup, expected rows, and environment blockers. | FR-20, NFR-12, NFR-13 | AC-12 | yes |
| TS-13 | Each execution task links to FR/NFR ids and updates workflow memory before commit. | NFR-11, NFR-13 | AC-13 | yes |
| TS-14 | Panel has first-class live views for Component Tree, Fx Graph, RefSubject States, HMR, Navigation, OTEL, and Sources. | FR-21, FR-29, NFR-14 | AC-14 | yes |
| TS-15 | Deterministic RealWorld smoke scenario triggers every required lane and fails if any lane is absent. | FR-30, NFR-15 | AC-15 | yes |
| TS-16 | Built extension or equivalent panel harness proves connect, reload, replay, and no stale fixture state. | FR-31, FR-32, FR-35, NFR-19 | AC-16 | yes |
| TS-17 | Invalid bridge payloads fail closed and do not crash RealWorld. | FR-33, NFR-18 | AC-17 | yes |
| TS-18 | Devtools-disabled RealWorld exposes no `__TYPED_DEVTOOLS__` bridge. | FR-34, NFR-1, NFR-2 | AC-18 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking `TS-*` scenarios must pass before production-grade success. Blocked scenarios force replanning and cannot count as passing.
- code_coverage_target: no global percentage target; require scenario coverage for every requested capability.
- validation_hooks:
  - `pnpm --filter @typed/app test` or narrower generated browser runtime tests;
  - `pnpm --filter @typed/devtools-runtime test`;
  - `pnpm --filter @typed/devtools-chrome test`;
  - RealWorld devtools smoke command defined in planning;
  - RealWorld HMR local smoke where HMR rows are validated;
  - `git diff --check` before commits.

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| RealWorld devtools smoke mode | missing | Add explicit smoke opt-in without changing default builds. |
| Shared generated runtime/event bus | partial | Verify current generated browser devtools path and patch only if it fragments runtime state. |
| Chrome panel live RealWorld connection | partial | Prefer inspected-window transport; assert fixture rows are absent when connected. |
| Component/template mount events | partial | Verify DOM registry receives compiled template observer events in RealWorld. |
| DOM binding deep links | partial | Verify mounted binding ids from RealWorld; document missing compiler/template path if absent. |
| Source Analyzer bridge | partial or missing | Implement or integrate compiler/dev-server source facts; unavailable state is only an interim diagnostic path. |
| Fx graph capture | missing or partial | Implement live topology fields and RealWorld graph proof before finalization. |
| RefSubject state capture | partial | Implement snapshot/update proof with value/version/subscriber/history fields. |
| HMR facts | partial | Coordinate with compiler-capability agent; preserve structured status. |
| Navigation capture | partial | Wire or verify capture through real router/navigation path. |
| OTEL trace source | undecided | Choose and implement one RealWorld trace source before finalization. |
| `hurl` local prerequisite | unknown | Recheck `command -v hurl` before acceptance claims. |

## Acceptance Failure Policy

- If a TS scenario fails because the proof harness is wrong, fix the smallest harness/runtime/bridge/panel layer in this workflow.
- If a TS scenario fails because compiler facts are missing, document the exact missing fact/event/id, obtain ownership direction, and keep the scenario failing until the dependency is resolved.
- If a runtime instrumentation change alters Fx, RefSubject, Router, or Layer semantics, stop and reduce to a semantic-preservation test before continuing.
- If Chrome extension automation is blocked, keep an inspected-window harness proof and document manual Chrome panel steps.
- If environment prerequisites are missing, record the exact command and error, then continue only with gates not depending on that prerequisite.
- Do not claim production-grade DevTools success until every requested capability is live against RealWorld and all blocking `TS-*` scenarios pass.
