# Requirements - Typed UI Select Layer

Status: approved by prior Menu/Listbox/Select sequence and 2026-05-22 request to continue Ariakit ports.

## Functional Requirements

- FR-1: Export `Select` from `@typed/ui`.
- FR-2: `Select` state must be a direct `RefSubject.RefSubject<Select.State<Value>>`.
- FR-3: `Select.Trigger` must emit native Popover trigger attributes and selected/open state attrs.
- FR-4: `Select.Content` must emit native `popover` plus `role="listbox"` semantics.
- FR-5: `Select.Option` must emit `role="option"`, selected/active/disabled semantics, and public data attrs.
- FR-6: Clicking an enabled option must update selected value, update active id, and close the popup.
- FR-7: Native toggle events on content must mirror popup open state into the backing RefSubject.
- FR-8: Movement helpers must skip disabled items, respect DOM order, loop, and update active id without changing selected value.
- FR-9: Component option APIs must preserve renderable error/service inference from non-content options.

## Acceptance Criteria

- AC-1: `@typed/ui` exports `Select`.
- AC-2: Tests prove trigger/content native Popover relationship, roles, and data attrs.
- AC-3: Tests prove option click selection and close behavior.
- AC-4: Tests prove native toggle mirroring.
- AC-5: Tests prove movement skips disabled items and preserves selected value.
- AC-6: Type tests prove non-content option inference.
- AC-7: `pnpm --filter @typed/ui test` and `pnpm --filter @typed/ui build` pass.
