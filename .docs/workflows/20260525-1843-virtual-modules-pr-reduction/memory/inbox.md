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

## 2026-05-26 - T3b2a HttpApi production pruning

- HttpApi implicit production partial output now emits only requested client-safe exports plus concrete dependencies; explicit `mode=client` stays broad.
- `DependenciesLayer`-only output emits only `Layer.empty`, without `Api`, `HttpApiClient`, endpoint, group, or OpenApi imports.
- `Api`, `OpenApi`, `Client`, `makeClient`, `makeClientWith`, and `makeUrlBuilder` production permutations have focused pruning coverage.
- Type-only requested exports count as declaration demand for HttpApi output. `import type { Api }` now keeps the generated `Api` declaration and is covered by generated-source type checking.
- A shared core helper for value-or-type export demand was not added in this slice because app tests resolve `@typed/virtual-modules` through built `dist`; revisit as a dedicated core change if other plugins need the same helper.

## 2026-05-26 - T3b2b1 path composable production pruning

- Path composable plugins now honor production requested exports for `typed:api-handler` and `typed:route-template`.
- `typed:api-handler` metadata-only output avoids endpoint and `ApiHandlers` imports; handler output imports `ApiHandlers` only when requested.
- `typed:api-handler` optional endpoint exports such as `body` can be emitted without unrelated endpoint exports.
- `typed:route-template` route-only output avoids handler/helper imports; handler-only output imports only the generated handler helpers and route module.
- `typed:route-template` concern exports such as `guard` can be emitted independently.
- Browser/server files are dirty from other work and remain untouched. Component, route-handler, and browser/server plugin families remain for the next split.

## 2026-05-26 - T3b2b2a route-handlers production pruning

- `route-handlers:` exposes only a default export, so production partial pruning is a default/no-match gate.
- Value or type-only `default` requests emit the existing full route handler graph.
- Missing production requests return `export {};` before directory discovery imports are emitted.
- `pnpm --filter @typed/app exec tsc --noEmit --pretty false` caught non-predicate narrowing errors that Vitest missed. Keep `tsc --noEmit` in later T3/T4 gates when changing virtual-module build context code.
- Strictness fixes landed for earlier pruning code in composable path/dir emitters, html, and Storybook runtime by replacing boolean-helper assumptions with explicit context discriminant checks.

## 2026-05-26 - T3b2b2b1 component production pruning

- Component virtual modules now honor production requested exports through a local emit plan and dependency plan.
- `InputSchema`-only output avoids Storybook and component runtime imports; story, property, and render helpers emit local concrete dependencies without making them public exports unless directly requested.
- Missing production requests return `export {};`; all-export and no-context builds still use the full component output.
- Component tests cover `InputSchema`, `makeComponentStory`, `makeComponentProperty`, `render`, no-match, and all-export production contexts.
- Browser/server plugin files remain dirty from other work and were not touched. Treat browser/server pruning as T3b2b2b2.
