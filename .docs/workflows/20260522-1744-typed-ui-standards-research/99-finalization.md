# Finalization - Typed UI Standards

Date: 2026-05-22

## Decisions Made

- Finalized the Typed-native Ariakit-like substrate on `codex/typed-beta`.
- Kept component APIs on `function Name<const Opts extends NameOptions>(options: Opts)` so option renderables preserve error and service inference.
- Kept collection registration scope-owned via `Scope.addFinalizer`; callers do not manually unregister.
- Kept Popover native-only and documented CSS Anchor Positioning as the future layered-positioning goal.

## Evidence Used

- `pnpm --filter @typed/ui test`: 15 files, 56 tests.
- `pnpm --filter @typed/ui build`.
- `git merge-base --is-ancestor origin/codex/realworld-flagship-example HEAD`.

## Open Risks

- Browser-runner verification for native popover/focus behavior remains future work; the current slice uses package-local happy-dom tests.
- Menu, Select/Listbox, and Combobox remain intentionally deferred.

## Current Status Note

This note captured the state of this slice at finalization time. Later parity passes added Menu, Select/Listbox, Combobox, component-rendered browser tests, and the native popover/dialog baseline; use `.docs/workflows/20260521-2247-typed-native-ariakit-port/ariakit-parity-matrix.md` as the current source of truth.

## Readiness

- The UI standards tranche is ready in PR #3 as part of `codex/typed-beta`.
