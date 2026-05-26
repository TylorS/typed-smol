# Memories

- `@typed/app/runtime` is the browser handoff boundary for compiled DOM templates. Generated browser modules should import route/action/devtools runtime helpers through `@typed/app/runtime`, not directly from `@typed/devtools-runtime`.
- Clearing `examples/realworld/node_modules/.typed` can expose stale virtual-module output. Rerun `pnpm --filter typed-realworld exec vmc -p tsconfig.json` before treating cache-missing virtual targets as source failures.
- `typed-realworld test` must exclude `src/tests/hmr/**`; those files are Playwright tests and are run through `pnpm --filter typed-realworld test:hmr:local`.
- The installed `oxlint` in this workspace rejects category flags such as `--correctness-category`. RealWorld overrides lint categories to `{}` in `typed.config.ts` so `typed check` uses a compatible lint invocation.
- `typed-realworld test:acceptance:local` remains unverified until Hurl is installed; `command -v hurl` exited 1 on 2026-05-24.
- VS Code virtual modules tree must resolve each discovered import with `getProjectRoot(importer)`; resolving everything against the monorepo workspace root hides nested app virtual modules when only the nested app has `vmc.config.ts`.
- TS plugin responsiveness work should instrument latency before optimizing. The suspected hot paths are fallback program creation, type-target bootstrap program creation, TypeInfo session creation, artifact fingerprinting, dependency hashing, stale-record rebuild, and diagnostics refresh.
- Generated HttpApi client wrappers must not use `TypedRawClient<any, any>` plus `(...args) => unknown`; that is the source of `TypedClientInput` returning unknown.
- `examples/realworld/vite.config.ts` should call `typedVitePlugin()` and let `typed.config.ts` provide `entry: "src/server.ts"`; passing explicit plugin options skips config loading and leaves dev `/api/*` requests to Vite's HTML fallback.
- Server-side RealWorld auth still needs to provide `BrowserAuth` for route rendering, but its state must be `unavailable`, not `unauthenticated`.
- Do not run RealWorld `vmc` concurrently with `typed build` when validating clean generated artifacts; the virtual artifact store can produce transient missing-target diagnostics under concurrent regeneration.
- Compiled server template runtime currently needs a proof/fix for providing `RefSubject.CurrentComputedBehavior = "one"` like `HtmlRenderTemplate` does for interpreted SSR.
- DevTools panel fixture-backed data must not be accepted as proof of live Components/Fx/RefSubject support. The panel should show live replay data or explicit unavailable states.
- Chrome DevTools panel and extension background fallbacks must return unavailable/disabled data, not protocol fixtures. Production rows should come from `SubscribeRuntimeEvents` replay.
- `@typed/app/runtime` DevTools mode should create one `DevtoolsRuntimeService`, pass it to `makeDomRegistry({ runtime })`, and install the browser bridge with the same runtime so component events and panel replay share one event bus.
- TS plugin latency diagnostics are opt-in through `debugTimings: true` and log `timing ...` lines through the tsserver logger for fallback program creation, type-target bootstrap, TypeInfo session creation, artifact fingerprinting/dependency hashing, and semantic diagnostics.
- TS plugin `create()` should not eagerly build a fallback full TypeScript `Program`; keep fallback creation lazy for TypeInfo-dependent virtual modules when the language-service program is unavailable.
