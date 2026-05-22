# Requirements - Typed UI Standards Implementation

Status: approved for implementation by human request on 2026-05-22: "anchor positioning sounds like a great goal to include ... let's implement 1-6".

## Functional Requirements

- FR-1: Add a reusable DOM option type map for element-backed `@typed/ui` components.
- FR-2: Replace Link's local anchor-only DOM option types with the reusable DOM option map.
- FR-3: Add Schema-backed `DataAttr` helpers for whole `.data={object}` values using `Schema.Struct.Fields`.
- FR-4: Add ref-based startup helpers that initialize public `RefSubject` state from server-emitted DOM `data-*` attributes.
- FR-5: Add state helpers that use direct `RefSubject.RefSubject<State>` values, not a separate Store abstraction.
- FR-6: Add Collection substrate for item registration, metadata, disabled state, ids, cleanup, and DOM-order sorting.
- FR-7: Add Composite substrate for active item state, roving tabindex defaults, optional virtual focus, orientation, loop, rtl, and keyboard movement.
- FR-8: Add Tabs built on Composite with tablist/tab/tabpanel roles, selected state, manual/automatic activation, and data attrs.
- FR-9: Add RadioGroup built on Composite with radiogroup/radio roles, checked value state, and toolbar-compatible focus behavior.
- FR-10: Add Toolbar built on Composite with one tab stop and mixed-control arrow navigation.
- FR-11: Keep Menu, Select/Listbox, and Combobox as planned later milestones rather than implementing them in this slice.
- FR-12: Include CSS Anchor Positioning as an explicit design goal and emitted-data/attribute compatibility point, without adding a custom positioning engine.
- FR-13: Public names should stay Ariakit-like where they fit Typed's model.

## Non-Functional Requirements

- NFR-1: Prefer native platform behavior and APG contracts before custom JavaScript behavior.
- NFR-2: Use TDD for each implementation task.
- NFR-3: Keep functions small, composable, and Effect-friendly.
- NFR-4: Avoid unrelated package, lockfile, or app changes.
- NFR-5: Browser-sensitive behavior must be designed for later browser verification; this slice may use package-local tests where browser dependencies are not linked.

## Acceptance Criteria

- AC-1: `@typed/ui` exports `Dom`, `DataAttr`, `StartupRef`, `State`, `Collection`, `Composite`, `Tabs`, `RadioGroup`, and `Toolbar`.
- AC-2: Link continues to pass existing tests after adopting reusable DOM option types.
- AC-3: DataAttr tests prove encode/decode for boolean, literal, optional, invalid, and whole-object composition cases.
- AC-4: StartupRef tests prove one ref can hydrate multiple data attrs into a `RefSubject`.
- AC-5: Collection tests prove registration, cleanup, disabled filtering, and DOM-order sorting.
- AC-6: Composite tests prove next/previous/home/end movement, loop boundaries, disabled skipping, roving tabindex values, and virtual-focus state.
- AC-7: Tabs tests prove roles, aria relationships, selected panel visibility, activation modes, and public data attrs.
- AC-8: RadioGroup tests prove checked value, arrow behavior, toolbar mode behavior, and public data attrs.
- AC-9: Toolbar tests prove role/orientation labels and one-tab-stop arrow movement across controls.
- AC-10: Anchor Positioning is documented as a target for popover/menu examples and future layered components.

## Source Trace

- `02-research.md`: Baseline, native layered UI, APG composite behavior, Ariakit substrate mapping, Anchor Positioning recommendation.
- `packages/ui/src/Link.ts`: current local DOM option type duplication.
- `packages/ui/src/Link.test.ts`: existing package test style and render helpers.
