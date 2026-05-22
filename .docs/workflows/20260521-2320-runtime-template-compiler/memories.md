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
