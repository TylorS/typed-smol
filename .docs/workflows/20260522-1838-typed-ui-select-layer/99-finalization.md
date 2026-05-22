# Finalization - Typed UI Select Layer

Date: 2026-05-22

## Decisions Made

- Added `Select` as the Popover-backed value picking wrapper after Menu and Listbox.
- Kept option click behavior simple: select value, set active id, and close.
- Deferred hidden form inputs, native `<select>` integration, typeahead, and Combobox.

## Evidence Used

- Red run: `pnpm --filter @typed/ui test` failed because `Select.ts` did not exist.
- Green run: `pnpm --filter @typed/ui test` passed with 18 files and 66 tests.
- Build run: `pnpm --filter @typed/ui build` passed.

## Open Risks

- Browser-runner coverage remains future work.
- Form integration remains a future Select enhancement.
- Combobox remains the next Ariakit-like port.

## Readiness

- The Select slice is ready as the next `@typed/ui` Ariakit-like primitive on `codex/typed-beta`.
