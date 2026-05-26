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

## 2026-05-26 - T3a plugin production pruning

- T3 is split. T3a covers router, Storybook, env, config, and html only; HttpApi, composable modules, component, browser/server, and route-handler families remain T3b.
- Router production partial output keeps route-template imports but skips unused `typed:services`, `typed:guard`, `typed:layout`, and `typed:catch` imports when the requested exports do not need those concerns.
- Storybook runtime production partial output now emits only requested runtime exports and direct dependencies. `makeClient`-only imports only the primary API target, `DependenciesLayer`-only does not require an emitted `apiLayers` binding, `@typed/router` appears only for multi-route merge output, and the no-API `HttpClient` type import appears only for `makeClientWith`.
- Env/config production partial output filters by requested key exports before validation/serialization, so invalid or unserializable unrequested keys do not poison the requested subset.
- Html production partial output can emit only `html` or only `renderHtml` without pulling filesystem, `typed:config`, `loadHtml`, or build-path helpers.

## 2026-05-26 - T3b1 directory composable production pruning

- Directory composable plugins now honor production requested exports for `modules` and each concern map export.
- `typed:services` can emit `dependencyInputs`, `dependencyLayers`, `dependencyLayerList`, and `DependenciesLayer` independently; partial `DependenciesLayer` no longer requires an emitted `dependencyLayerList` binding.
- Directory concern plugins return `export {};` when a production build requests no matching export.
- Path composable plugins `typed:route-template` and `typed:api-handler` were intentionally left unchanged in T3b1.
- Residual risk: tests cover services, guard, and headers as representative families. Layout, catch, errors, middlewares, prefix, and openapi share the same map-pruning core.
