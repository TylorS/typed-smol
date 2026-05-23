# Memories — Storybook Framework Integration

## Inbox

- T-1 starts with package-boundary tests before source entrypoints to preserve red-green evidence for the package skeleton.
- T-1 red failure was the expected missing `src/index.ts` assertion in `packages/storybook/src/package-boundary.test.ts`.
- T-1 green checks: `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.
