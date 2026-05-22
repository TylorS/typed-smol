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
