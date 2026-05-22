# Workflow Memory - Typed UI Select Layer

- Select is the next wrapper after Menu and Listbox. It should keep native Popover layering and Listbox option semantics separate from future form integration.
- Select option clicks update `value`, update `activeId`, and set `open` false. Movement updates active option only, preserving the selected value.
- Verification passed with `pnpm --filter @typed/ui test` (18 files, 66 tests) and `pnpm --filter @typed/ui build`.
- Corrected after review: `Select.Option` public `id`, `value`, and `disabled` props are renderables, not static-only values. Event handlers resolve renderable ids/values before updating state.
