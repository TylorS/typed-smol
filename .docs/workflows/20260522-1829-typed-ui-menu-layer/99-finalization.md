# Finalization - Typed UI Menu Layer

Date: 2026-05-22

## Decisions Made

- Added `Menu` as the first next-layer component after the existing substrate and proof widgets.
- Kept the implementation native-Popover-only with no overlay, focus trap, or positioning engine.
- Preserved `Opts extends Options` component APIs for option error/service inference.

## Evidence Used

- `pnpm --filter @typed/ui test`: 16 files, 59 tests.
- `pnpm --filter @typed/ui build`.

## Open Risks

- Browser-runner coverage for native Popover behavior remains future work.
- Listbox, Select, Combobox, submenus, typeahead, checkbox menu items, and radio menu items remain deferred.

## Readiness

- The Menu slice is ready as the next `@typed/ui` layer on `codex/typed-beta`.
