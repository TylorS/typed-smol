# Workflow Memory - Typed UI Menu Layer

- User approved Menu as the first next-layer component before Listbox and Select.
- `Menu` follows existing UI component style: direct `RefSubject`, native Popover attributes, APG roles, `Opts extends Options` option inference, and movement helpers over `Collection.Item` arrays.
- Verification passed with `pnpm --filter @typed/ui test` (16 files, 59 tests) and `pnpm --filter @typed/ui build`.
- Corrected after review: `Menu.Item` public `id` and `disabled` props are renderables, not static-only values.
