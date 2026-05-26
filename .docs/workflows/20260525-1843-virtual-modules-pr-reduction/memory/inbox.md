# Memory Inbox

## 2026-05-25 - T0 baseline

- Exact T1 owner files are currently clean, so raw HttpApi client cleanup can start without direct file conflict.
- RealWorld validation is not fully isolated because adjacent RealWorld files are dirty, especially `examples/realworld/src/Api.ts`.
- `examples/realworld/node_modules/.typed/virtual` exists and contains stale wrapper names. T1 must clean/regenerate before trusting artifact scans.
- Wrapper names remain in source/test/docs surfaces, including app HttpApi generator/tests, Storybook runtime generator/tests, RealWorld Home story, Storybook README/fixtures, and Vite plugin tests.

## 2026-05-25 - T1 raw client cleanup

- Generated HttpApi client mode now exposes the raw Effect `Api`, `Client`, `makeClient`, `makeClientWith`, and `makeUrlBuilder` surface without wrapper endpoint mappings.
- Storybook runtime now re-exports raw `makeClient` and `makeClientWith`. The no-API fallback must keep compatible call signatures for both helpers.
- RealWorld `Home.stories.ts` uses `makeClient` from `typed:storybook/runtime?path=/`.
- Clean/regenerated RealWorld virtual artifacts no longer contain `TypedClient` wrapper names.

## 2026-05-26 - T2 production closure contract

- `VirtualModuleBuildContext.closure` is required and derived from shared core helpers, so plugins can rely on a closure contract instead of checking for an optional side channel.
- Vite build contexts now fingerprint requested exports plus dependency closure. Dev mode still preserves `{ kind: "all", reason: "dev mode" }`.
- Conservative Vite production fallbacks are explicit for missing importer source and virtual importer source.
- `packages/virtual-modules-vite/vitest.config.ts` aliases `@typed/virtual-modules` to workspace source; otherwise the package test suite can accidentally execute stale `dist` from the core package.
- T2 intentionally seeds empty `pluginDeclared`, `typeInfoReachable`, and `routeOrAppReachable` sets. T3/T6 must populate those dimensions instead of creating plugin-local closure semantics.
