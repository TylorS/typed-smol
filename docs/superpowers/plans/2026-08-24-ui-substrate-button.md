# UI DOM Substrate and Button Implementation Plan

**Goal:** Restore the smallest current-API DOM substrate for `@typed/ui` and prove it through a public headless `Button` component.

**Architecture:** `Dom` owns typed native host props, exact error/service channel preservation, user-first event composition, internal-first ref composition, hydration metadata preservation, and host rendering. Components infer their public Fx channels directly through `Renderable.Error` / `Renderable.Services`. Stateful components build directly on `RefSubject.hydrate` / `hydrateAll`; there is no parallel `Reactive`, `State`, or `DataAttr` abstraction.

**Tech Stack:** TypeScript 7, Effect v4, `@typed/fx`, `@typed/template`, Vitest Node/browser, Playwright Chromium.

**Spec:** `docs/superpowers/specs/2026-08-23-ui-components-design.md`

## Constraints

- Hard minimum: Baseline 2026; latest stable Chromium, Firefox, and Safari/WebKit only.
- Keep `Link`, `HttpRouter`, and `streamingSsrForHttp` unchanged.
- Do not add `DataAttr`, `StartupRef`, `Resumability`, a compiler, overlay shims, or compatibility polyfills.
- `Dom.composeRefs(state, userRef)` and `Dom.mergeProps(...)` must retain the callable hydration protocol in both runtime values and static types.
- An owning host receives one composed hydration ref invocation. Stateful widgets use `hydrateAll` rather than multiple template ref subscriptions.
- User `on*` and `@*` event handlers run first; `preventDefault()` skips internal behavior.
- Wildcard channel types are allowed only in generic `extends` constraints. Exported values and parameters preserve concrete error/service type parameters.
- Do not commit, push, publish, or open a pull request unless requested.

## Task 1: Hydration-aware DOM composition

**Files:**

- `packages/ui/src/Dom.ts`
- `packages/ui/src/__tests__/Dom.test.ts`
- `packages/ui/src/__tests__/dom.type-test.ts`

- [x] Type writable native properties and Baseline 2026 popover/invoker attributes.
- [x] Compose `on*` and `@*` handlers user-first with `preventDefault()` cancellation.
- [x] Compose Effect, Stream, and Fx refs without erasing error/service channels.
- [x] Retain exactly one `HydrationRefTypeId` owner and reject multiple hydration owners.
- [x] Preserve the hydration-ref protocol through `mergeProps` statically and at runtime.
- [x] Let `renderHost` forward top-level `ref`, `on*`, and `@*` options automatically.
- [x] Bind `property(key, fallback)` to the exact options object for nullish internal defaults.
- [x] Keep hydration first and the caller ref second so hydration completes before observation.
- [x] Verify focused runtime and type tests.

## Task 2: Public stateless Button host

**Files:**

- `packages/ui/src/Button.ts`
- `packages/ui/src/__tests__/Button.test.ts`
- `packages/ui/src/__tests__/Button.browser.test.ts`
- `packages/ui/src/__tests__/button.type-test.ts`
- `packages/ui/src/index.ts`
- `packages/ui/README.md`

- [x] Render a native `<button>` with the safe `type="button"` default.
- [x] Support renderable disabled state, typed click handlers, caller props, refs, and custom hosts.
- [x] Infer the returned Fx channels directly from the exact options object.
- [x] Export `Button` and `Dom` namespaces without changing direct Link/HTTP exports.
- [x] Keep Button stateless while allowing merged parent/caller hydration refs to pass through `Dom`.

## Task 3: Slice verification

- [x] `corepack pnpm --filter @typed/ui test:types`
- [x] Focused `Dom.test.ts` and `Button.test.ts`
- [x] `corepack pnpm --filter @typed/ui test:node`
- [x] `corepack pnpm --filter @typed/ui test:browser`
- [x] `corepack pnpm --filter @typed/ui build`
- [x] `corepack pnpm exec oxlint packages/ui/src`
- [x] `git diff --check`

## Next component slice

Build the smallest stateful vertical slice around a direct `RefSubject.hydrate` state and attach that callable state to its owning host through `Dom.mergeProps`. If the component has multiple serializable state refs, compose them once with `RefSubject.hydrateAll`. Keep runtime-only collections and DOM element registries out of the hydration payload.
