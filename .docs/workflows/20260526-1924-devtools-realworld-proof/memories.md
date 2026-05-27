# Memories - DevTools RealWorld End-To-End Proof

## T0 - Preflight And Ownership Boundary

- recorded_at: 2026-05-26 20:01:10 EDT
- branch: `codex/typed-beta`
- workspace isolation: normal checkout, not linked worktree (`git_dir == git_common`), no superproject.
- `hurl`: missing. `command -v hurl` exited 1 with no output.

### Baseline Commands

- `pnpm --filter @typed/devtools-protocol test`: passed. Vitest reported 4 files, 25 tests.
- `pnpm --filter @typed/devtools-runtime test`: passed. Vitest reported 9 files, 49 tests.
- `pnpm --filter @typed/devtools-chrome test`: passed. Vitest reported 8 files, 40 tests.

### Existing Dirty Files Not Owned By T0

- `.cursor/hooks/state/continual-learning.json`
- `examples/counter/typed.config.ts`
- `examples/realworld/package.json`
- `examples/realworld/src/Api.ts`
- `examples/realworld/src/application/Comments.ts`
- `examples/realworld/src/common/components/Banner.ts`
- `examples/realworld/src/common/components/CommentForm.ts`
- `examples/realworld/src/common/components/FeedContent.ts`
- `examples/realworld/src/common/components/FeedToggle.ts`
- `examples/realworld/src/tests/package.test.ts`
- `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- `packages/app/src/ServerVirtualModulePlugin.test.ts`
- `packages/app/src/internal/emitHttpApiSource.ts`
- `packages/app/src/internal/emitServerSource.ts`
- `packages/virtual-modules-ts-plugin/package.json`
- `packages/virtual-modules-ts-plugin/src/plugin.ts`
- `packages/virtual-modules-vite/src/vitePlugin.test.ts`
- `packages/virtual-modules-vite/src/vitePlugin.ts`
- `packages/virtual-modules/src/CompilerHostAdapter.test.ts`
- `packages/virtual-modules/src/CompilerHostAdapter.ts`
- `packages/virtual-modules/src/LanguageServiceAdapter.test.ts`
- `packages/virtual-modules/src/LanguageServiceAdapter.ts`
- `packages/virtual-modules/src/internal/VirtualRecordStore.ts`
- `scripts/publish-beta.sh`

### Ownership Notes

- T1 intends to edit `examples/realworld/package.json`, which already has another agent's hunk changing `typecheck:stories` from `pnpm storybook:build` to `vmc --noEmit -p tsconfig.storybook.json && pnpm storybook:build`.
- Preserve existing dirty hunks and stage only workflow-owned changes.
- Reread any overlapping file before editing because concurrent agent work is active in RealWorld, app virtual-module tests, compiler host adapter files, virtual-modules vite plugin files, and publish scripts.
