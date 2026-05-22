# Finalization - Typed UI Listbox Layer

Date: 2026-05-22

## Decisions Made

- Added `Listbox` as the single-selection primitive after `Menu`.
- Kept movement and selection separate: movement updates `activeId`; click or `select` updates the selected value.
- Kept the implementation single-select only, leaving Select, Combobox, multi-select, and typeahead for later slices.

## Evidence Used

- Red run: `pnpm --filter @typed/ui test` failed because `Listbox.ts` did not exist.
- Green run: `pnpm --filter @typed/ui test` passed with 17 files and 62 tests.
- Build run: `pnpm --filter @typed/ui build` passed.

## Open Risks

- Browser-runner coverage remains future work.
- Select/Combobox composition around Listbox is not implemented yet.

## Readiness

- The Listbox slice is ready as the next `@typed/ui` Ariakit-like primitive on `codex/typed-beta`.
