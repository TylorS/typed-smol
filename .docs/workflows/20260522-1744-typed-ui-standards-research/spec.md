# Spec - Typed UI Standards Implementation

## Architecture

This slice establishes the reusable substrate for `@typed/ui` before adding more concrete widgets. The public model is direct `RefSubject` state plus small component modules, not a separate store layer.

The implementation is split into focused modules:

- `Dom.ts`: type-level DOM option map for element-backed component options.
- `DataAttr.ts`: Schema-backed `data-*` object encode/decode.
- `StartupRef.ts`: composable ref callbacks for DOM startup hydration.
- `State.ts`: service tag helper for current `RefSubject` state.
- `Collection.ts`: item registration and DOM order utilities.
- `Composite.ts`: collection-backed active item and keyboard movement substrate.
- `Tabs.ts`: tabs on top of Composite.
- `RadioGroup.ts`: radio group on top of Composite.
- `Toolbar.ts`: toolbar on top of Composite.

## Native Platform Direction

`@typed/ui` should emit native DOM properties and ARIA attributes directly. Anchor Positioning is a first-class design goal for future layered components, but this slice does not include a custom JS positioning engine. Future Popover/Menu examples should be able to use native popover anchor relationships, `anchor-name`, `position-anchor`, `position-area`, and related CSS when the browser target supports them.

## State and Data

State modules expose constructors and operations around `RefSubject.RefSubject<State>`.

Public data attributes are projected from Schema-defined `.data={object}` values:

- Encoded data is `Partial<Record<string, string>>`.
- Decoding reads from `HTMLElement.dataset` or a plain record.
- Startup refs decode data attrs and merge them into the backing `RefSubject`.

## Collection and Composite

Collection owns stable item metadata:

- id
- element
- disabled
- optional value

Composite owns state and movement:

- activeId
- orientation
- loop
- rtl
- virtualFocus

Roving tabindex is the default. Virtual focus is explicit and represented by active id/`aria-activedescendant` data rather than moving DOM focus.

## Concrete Widgets

Tabs, RadioGroup, and Toolbar are the proof layer.

- Tabs maps selected id/value to APG tab roles and selected panel visibility.
- RadioGroup maps selected value to APG radio roles and keyboard behavior, with a toolbar mode that moves focus without changing value.
- Toolbar maps mixed controls into one tab stop with arrow movement.

## Verification

Tests use the package's existing Vitest + happy-dom style where DOM rendering is involved. Type tests use `expectTypeOf` where behavior is purely type-level.

Browser verification remains a future requirement for native Popover/Dialog and focus behavior that happy-dom cannot prove.
