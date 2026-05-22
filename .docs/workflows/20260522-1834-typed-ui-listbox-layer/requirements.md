# Requirements - Typed UI Listbox Layer

Status: approved by prior Menu/Listbox/Select sequence and 2026-05-22 user request to continue the Ariakit ports.

## Functional Requirements

- FR-1: Export `Listbox` from `@typed/ui`.
- FR-2: `Listbox` state must be a direct `RefSubject.RefSubject<Listbox.State<Value>>`.
- FR-3: `Listbox.Root` must emit APG `role="listbox"` semantics, labels, orientation, and virtual-focus active descendant when enabled.
- FR-4: `Listbox.Option` must emit APG `role="option"`, selected state, disabled state, roving tab index, and public data attrs.
- FR-5: Selecting an option must update both selected value and active id.
- FR-6: Movement helpers must skip disabled items, respect DOM order when elements are present, support loop boundaries, and update active id without changing selected value.
- FR-7: Component option APIs must preserve renderable error/service inference from non-content options.

## Acceptance Criteria

- AC-1: `@typed/ui` exports `Listbox`.
- AC-2: Tests prove root/option roles, selected/active/disabled attrs, and virtual-focus active descendant behavior.
- AC-3: Tests prove option click/selection updates the backing `RefSubject`.
- AC-4: Tests prove movement skips disabled items and loops through DOM order.
- AC-5: Type tests prove non-content option inference.
- AC-6: `pnpm --filter @typed/ui test` and `pnpm --filter @typed/ui build` pass.
