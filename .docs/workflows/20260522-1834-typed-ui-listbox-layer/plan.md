# Plan - Typed UI Listbox Layer

## Task 1: Listbox Primitive

Requirements: FR-1 through FR-7, AC-1 through AC-6.

- [x] Write failing `packages/ui/src/Listbox.test.ts` for root/option semantics, selection, virtual focus, data attrs, and movement.
- [x] Write failing `ComponentOptions.test.ts` coverage for `Listbox.Root` non-content option inference.
- [x] Verify tests fail because `Listbox.ts` does not exist / `Listbox` is not exported.
- [x] Implement `packages/ui/src/Listbox.ts`.
- [x] Export `Listbox` from `packages/ui/src/index.ts`.
- [x] Update `packages/ui/README.md`.
- [x] Run `pnpm --filter @typed/ui test`.
- [x] Run `pnpm --filter @typed/ui build`.
- [x] Update workflow memory and commit the slice.
