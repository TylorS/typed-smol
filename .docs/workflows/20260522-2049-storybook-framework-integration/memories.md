# Memories — Storybook Framework Integration

## Inbox

- T-1 starts with package-boundary tests before source entrypoints to preserve red-green evidence for the package skeleton.
- T-1 red failure was the expected missing `src/index.ts` assertion in `packages/storybook/src/package-boundary.test.ts`.
- T-1 green checks: `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.
- T-2 dependency check: `storybook` and `@storybook/builder-vite` are current at `10.4.1`, while `@storybook/types` is still `8.6.14`; use Storybook v10's bundled `storybook/internal/types` type surface instead of adding old `@storybook/types`.
- T-2 red failure was missing public exports in `public-surface.test.ts`; green checks were `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.
- T-3 `viteFinal` composes by appending `typedVitePlugin(frameworkOptions.typedVite ?? {})` after existing Vite plugins and returns the same config object; focused tests pin plugin order for `compression: false` and `serverEntry: false`.
- T-4 renderer tests need a direct `happy-dom` dev dependency in `packages/storybook` because the package creates DOM roots under Vitest.
- T-4 `renderToCanvas` delegates to `@typed/app/runtime.mount`, calls Storybook `showMain` after a successful mount, and returns a teardown that runs `MountedApp.dispose`.
- T-4 intentionally casts the mounted Effect requirement channel to `never`; T-5 must replace this no-harness boundary with explicit layer/runtime harness composition for server-aware stories.
