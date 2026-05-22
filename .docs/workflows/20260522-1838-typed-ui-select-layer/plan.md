# Plan - Typed UI Select Layer

## Task 1: Select Primitive

Requirements: FR-1 through FR-9, AC-1 through AC-7.

- [x] Write failing `packages/ui/src/Select.test.ts` for native trigger/content, listbox/option semantics, option click selection, toggle mirroring, and movement.
- [x] Write failing `ComponentOptions.test.ts` coverage for `Select.Content` non-content option inference.
- [x] Verify tests fail because `Select.ts` does not exist / `Select` is not exported.
- [x] Implement `packages/ui/src/Select.ts`.
- [x] Export `Select` from `packages/ui/src/index.ts`.
- [x] Update `packages/ui/README.md`.
- [x] Run `pnpm --filter @typed/ui test`.
- [x] Run `pnpm --filter @typed/ui build`.
- [x] Update workflow memory and commit the slice.
