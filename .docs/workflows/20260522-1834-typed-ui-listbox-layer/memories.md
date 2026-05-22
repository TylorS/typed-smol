# Workflow Memory - Typed UI Listbox Layer

- Listbox is the second next-layer Ariakit-like port after Menu and should be the selection primitive that later Select wraps.
- Listbox movement updates `activeId` only; selection is explicit through `select` or option click. This keeps it usable for Select and Combobox activation semantics later.
- Reactive option `data-*` values should map from the backing state `RefSubject` with `RefSubject.mapEffect`; deriving them from a computed boolean Effect passed tests partially but did not keep `data-selected` live after click updates.
- Verification passed with `pnpm --filter @typed/ui test` (17 files, 62 tests) and `pnpm --filter @typed/ui build`.
- Corrected after review: `Listbox.Option` public `id`, `value`, and `disabled` props are renderables, not static-only values. Event handlers resolve renderable ids/values before updating state.
