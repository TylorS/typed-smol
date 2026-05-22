# Plan - Typed UI Menu Layer

## Task 1: Menu Primitive

Requirements: FR-1 through FR-7, AC-1 through AC-6.

- [x] Write failing `packages/ui/src/Menu.test.ts` for native Popover trigger/content, menu roles, data attrs, toggle mirroring, and movement.
- [x] Write failing `ComponentOptions.test.ts` coverage for `Menu.Content` non-content option inference.
- [ ] Verify the tests fail because `Menu.ts` does not exist / `Menu` is not exported.
- [x] Implement `packages/ui/src/Menu.ts`.
- [x] Export `Menu` from `packages/ui/src/index.ts`.
- [x] Update `packages/ui/README.md`.
- [x] Run `pnpm --filter @typed/ui test`.
- [x] Run `pnpm --filter @typed/ui build`.
- [x] Update workflow memory and commit the slice.
