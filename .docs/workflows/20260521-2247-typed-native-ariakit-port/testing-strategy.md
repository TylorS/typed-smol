# Testing Strategy - Typed Native Ariakit Port

## Test Type Taxonomy

- unit:
  - Store constructors, setter behavior, controlled/default state, selector reads, DataAttr Schema encode/decode, and ref startup helpers.
- integration:
  - Component rendering with `@typed/template`, provider lookup through Effect Context/Layer, SSR-to-DOM startup hydration, and component event handling.
- e2e:
  - Browser-level Dialog focus behavior and native Popover behavior. Use when DOM implementation tests cannot prove browser top-layer, focus-order, or native toggle semantics.

## Critical Path Scenarios

| ts_id | scenario | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------- | -------------- | ---------- | -------- |
| TS-1 | Store supports default, controlled, setter, event-read, selector-read, explicit store, and provider lookup behavior. | FR-5, FR-6, FR-7, NFR-2 | AC-2 | yes |
| TS-2 | DataAttr helpers encode/decode booleans, string literal unions, optional values, and invalid values through Effect Schema. | FR-8, FR-9, FR-10, NFR-2 | AC-3 | yes |
| TS-3 | Ref startup helper initializes a backing `RefSubject` from server-rendered DOM state without component-local parsing. | FR-11, NFR-7 | AC-4 | yes |
| TS-4 | Disclosure toggles with Enter/Space/activation and emits `aria-expanded`, optional `aria-controls`, and `data-open`. | FR-8, FR-12, FR-19, NFR-1 | AC-5 | yes |
| TS-5 | Dialog modal behavior covers role/label, initial focus, Escape close, close affordance, focus return, and `data-open`. | FR-8, FR-13, FR-19, NFR-1, NFR-3 | AC-6 | yes |
| TS-6 | Popover renders native `popover`, supports `popovertarget`/`popovertargetaction`, syncs from native toggle events, and remains non-modal. | FR-14, FR-15, FR-16, FR-17, NFR-3 | AC-7 | yes |
| TS-7 | Popover implementation contains no custom overlay mechanics, custom focus trap, or custom visibility fallback. | FR-18, NFR-6 | AC-7, AC-8 | yes |
| TS-8 | Documentation states native Popover API support is required and no custom popover polyfill is provided. | FR-14, FR-18, NFR-6 | AC-8 | yes |

## Coverage Targets

- critical_path_target: 100% of blocking TS-* scenarios must pass before finalization.
- code_coverage_target: no numeric coverage target for this tranche; behavioral scenario coverage is the gate.
- validation_hooks:
  - `pnpm --filter @typed/ui test`
  - browser test command for `@typed/ui` if added during implementation
  - focused typecheck/build command chosen during planning

## Dependency Readiness Matrix

| dep | status | unblock_action |
| --- | ------ | -------------- |
| `@typed/template` DOM/HTML rendering | ready | Use existing render and hydration tests as examples. |
| `@typed/fx` RefSubject | ready | Use existing RefSubject APIs; confirm current dirty worktree changes before implementation. |
| Effect Schema | ready | Use existing Schema encode/decode patterns from repo examples. |
| Browser native Popover API | partially environment-dependent | Planning must choose the browser test environment and unsupported-browser assertion strategy. |
| Browser-level focus test harness | needs planning | Decide whether to use existing Vitest browser setup or Playwright/browser plugin for Dialog/Popover checks. |

## Acceptance Failure Policy

- If a TS-* scenario fails because the design is insufficient, return to specification and revise before continuing execution.
- If a TS-* scenario fails because the implementation is incomplete, stay in red/green execution for that task.
- If native Popover API is unavailable in the selected browser test environment, do not add a custom fallback; either select a compliant browser environment or add an explicit unsupported-environment test.
- If implementation requires changes outside `@typed/ui`, pause and update requirements/spec before editing broader packages.
