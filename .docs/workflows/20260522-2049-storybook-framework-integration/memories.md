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
- T-5 runtime parameters live at `storyContext.parameters.typed`, not the top-level Storybook `RenderContext`.
- T-5 `defineTypedStoryRuntime({ layers })` preserves readonly layer tuples and the renderer applies them through `runWithTypedStoryRuntime()` while mounting.
- T-6 still needs the vertical fixture/portable story proof for route/API-backed behavior; T-5 only proves story-level Effect services.
- T-6 portable story coverage uses `setProjectAnnotations(projectAnnotations)`, `composeStory(ServerBacked, meta, projectAnnotations)`, and `Story.run({ canvasElement })`.
- T-6 fixture stories are included in the package build, so service-requiring Typed templates need `TypedStoryResult` to allow non-`never` Effect service channels.
- T-6 built story files should prefer pipe-style `SaveMessage.pipe(Effect.map(...))`; the direct two-argument `Effect.map(SaveMessage, ...)` failed type-checking in the fixture.
- T-7 package docs live in `packages/storybook/README.md` and cover config, runtime layer parameters, and portable story setup.
- Current focused verification commands for the package are `pnpm --filter @typed/storybook test`, `pnpm --filter @typed/storybook build`, and `pnpm exec oxlint packages/storybook`.
