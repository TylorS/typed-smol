# Runtime Template Compiler Execution Memories

## Task 5: DOM Emitter

- `DomRenderTemplate` keeps event listeners alive only while its render scope is open. DOM oracle tests that assert event behavior must interact with the runtime-rendered element before `Effect.scoped` closes.
- Fresh DOM rendering for node holes uses a trailing `<!--/n_i-->` comment. Primitive values are inserted before that marker; nullish values leave only the marker.
- Multi-root DOM templates are bounded by `<!--t_hash-->` and `<!--/t_hash-->`, matching `persistent(document, template.hash, fragment)`.
- Sparse class parts preserve each sparse segment as a class-list contribution. Joining the sparse text first incorrectly turns `["count-", "active"]` into `count-active`; runtime produces `count- active`.
- `.data=${{ userId: "7" }}` currently maps through `data-${key}` attribute setup, so the DOM attribute is `data-userid`, not `data-user-id`.

## Task 6: Fallback Path

- Fallback is a runtime handoff, not an optimization result. It should preserve the original `TemplateStringsArray` and call `html(template, ...values)` so existing `RenderTemplate` semantics and renderable type propagation stay intact.
- The diagnostic code for unsupported template/program shapes is `typed-template-fallback`; include `moduleId`, `reason`, and a human-readable message so generated virtual modules can surface precise fallback reasons later.

## Task 7: App Runtime Functions

- `@typed/app` now depends on `@typed/compiler`, `@typed/template`, and test-only `happy-dom` for the runtime template surface.
- Fallback DOM mount/hydrate must provide `DomRenderTemplate.using(root.ownerDocument)` and scope the one-shot render collection. Fallback server render must provide `HtmlRenderTemplate` and `Effect.scoped` to discharge `RenderTemplate` and `Scope` requirements.
- `pnpm --filter @typed/app test -- runtime` currently runs the full app test set because Vitest matches broadly; expect around 17 test files and roughly 299 tests.

## Task 8: RefSubject.Service

- `RefSubject.Service` was already present in `packages/fx/src/RefSubject/RefSubject.ts`; Task 8 added regression coverage rather than changing the implementation.
- For a service-backed ref `Count`, `yield* Count.service` retrieves the underlying `RefSubject`; `yield* Count` samples the current value because the service class itself implements the ref/fx/effect surface.

## Task 9: HMR Registry

- The app runtime HMR registry lives under the global key `__typed_hmr_registry__` and mirrors that registry into supplied hot data objects for reuse across module reloads.
- Compatibility is derived from shape fingerprint, version, and sorted dependency fingerprints. A shape/version/dependency mismatch disposes the previous entry and creates fresh state.
- `disposeHmrState` removes one service entry by module/service id; `pruneHmrState` is the future lifecycle hook for route/dependency cleanup.

## Task 10: Component HMR Analysis

- `analyzeComponentHmr` is descriptor-only. It does not rewrite source yet.
- Plain template optimization is not stateful HMR. Only route/dependency/component boundaries should report service-backed HMR descriptors.
- Inline `RefSubject.make(...)` descriptors use a generated service id of `${moduleId}#${localName}` until a later source rewrite or explicit user identity replaces it.

## Task 11: Dependency HMR Analysis

- Dependency participation is based on stable `RefSubject.Service(...)` identities unless an explicit opt-in is supplied.
- Anonymous `RefSubject.make(...)` in dependency modules is rejected for preservation; route component inline refs are handled by Task 10 descriptors instead.
- Dependency fingerprints currently combine module id with sorted service ids, or the explicit opt-in reason when no service id exists.

## Task 12: Closure Context Planning

- Closure context work is still descriptor-only. It does not transform source.
- Eligible captures become generated context fields with a deterministic `__typed_${closureName}_context` name.
- Mutable captures are rejected with `unsupported-closure-capture`; arbitrary closure serialization remains out of scope.

## Task 13: Browser Runtime Integration

- Browser generated source now delegates route rendering to `@typed/app` runtime functions: `mountRuntime` for mount mode and `hydrateRuntime` otherwise.
- Generated browser source no longer imports `drainLayer`, `render`, or `DomRenderTemplate`; `mount`/`hydrate` provide the DOM render template internally and the generated layer still provides `BrowserRouter(win)`.
- `mount`/`hydrate` in `@typed/app` accept `Fx<RenderEvent>` values in addition to compiled/fallback templates so route matchers can use the same runtime handoff.

## Task 14: Server Runtime Integration

- Server generated source imports `renderServer` from `@typed/app` and exposes `ServerRuntime` with `apiModules`, `routeModules`, `pageEntries`, and `renderServer` for downstream compiler/runtime handoff.
- `pageEntries` needs an explicit readonly array annotation in generated source; otherwise the server virtual module typecheck fixture reports implicit `any[]` diagnostics when no pages are present.
- Server runtime wiring must leave `typed:config` output directory usage intact so generated server code continues to avoid hard-coded `dist/client` paths.
