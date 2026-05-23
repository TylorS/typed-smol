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

## Current Status Note

This note captured the state of this slice at finalization time. Later parity passes added the deferred Listbox, Select, Combobox, submenu, typeahead, checkbox item, and radio item work; use `.docs/workflows/20260521-2247-typed-native-ariakit-port/ariakit-parity-matrix.md` as the current source of truth.

## Readiness

- The Menu slice is ready as the next `@typed/ui` layer on `codex/typed-beta`.
