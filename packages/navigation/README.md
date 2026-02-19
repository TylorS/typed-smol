# @typed/navigation

> **Beta:** This package is in beta; APIs may change.

`@typed/navigation` provides **browser and in-memory navigation**: current entry, history, and actions (navigate, back, forward, reload, etc.) with reactive state via RefSubject. It supports before-navigation and navigation events and integrates with the router. Use it when you need typed, Effect-based control over the browser history API or a memory-backed history for tests/SSR.

## Dependencies

- `effect`
- `@typed/fx`
- `@typed/id`

## API overview

- **Navigation** (service) — `origin`, `base`; reactive: `currentEntry`, `entries`, `transition`, `canGoBack`, `canGoForward`; actions: `navigate`, `back`, `forward`, `traverseTo`, `updateCurrentEntry`, `reload`; hooks: `onBeforeNavigation`, `onNavigation`.
- **Layers / providers:** `fromWindow` (browser history), `memory`, `initialMemory` (in-memory for tests or SSR).
- **Model types:** `Destination`, `NavigationEvent`, `BeforeNavigationEvent`, `Transition`, `NavigationError`, `RedirectError`, `CancelNavigation`, etc.; see `model`.
- **Blocking** — utilities for blocking navigation (e.g. unsaved changes).

## Example

```ts
import { Navigation } from "@typed/navigation";

// Inside Effect.gen(function* () { ... }); provide fromWindow (or memory) for browser
const nav = yield* Navigation;
const entry = yield* nav.currentEntry
yield* nav.navigate("/about", { history: "push" });
yield* nav.navigate("/about", { history: "replace" });
// entry is the current Destination before navigating
```

## API reference

### Navigation (service)

Effect service for browser or in-memory history. Access via `yield* Navigation` inside an Effect that has a Navigation layer provided.

| Member | Type | Description |
|--------|------|-------------|
| `origin` | `string` | Current origin (e.g. `"https://example.com"`). |
| `base` | `string` | Base URL (from `<base href>` or `"/"`). |
| `currentEntry` | `RefSubject.Computed<Destination>` | Reactive current history entry. |
| `entries` | `RefSubject.Computed<ReadonlyArray<Destination>>` | Reactive list of all history entries. |
| `transition` | `RefSubject.Filtered<Transition>` | Emits the in-progress transition when navigating. |
| `canGoBack` | `RefSubject.Computed<boolean>` | Whether `back()` can be called. |
| `canGoForward` | `RefSubject.Computed<boolean>` | Whether `forward()` can be called. |
| `navigate(url, options?)` | `Effect<Destination, NavigationError>` | Navigate to `url`; `options.history`: `"push"` \| `"replace"` \| `"auto"`, `state`, `info`. |
| `back(options?)` | `Effect<Destination, NavigationError>` | Go back one entry; `options.info` optional. |
| `forward(options?)` | `Effect<Destination, NavigationError>` | Go forward one entry; `options.info` optional. |
| `traverseTo(key, options?)` | `Effect<Destination, NavigationError>` | Go to the entry with the given `key`; `options.info` optional. |
| `updateCurrentEntry({ state })` | `Effect<Destination, NavigationError>` | Update the current entry’s `state` (replace in place). |
| `reload(options?)` | `Effect<Destination, NavigationError>` | Reload current entry; `options.info`, `options.state` optional. |
| `onBeforeNavigation(handler)` | `Effect<void, never, R \| Scope>` | Register a before-navigation handler; can redirect or cancel. |
| `onNavigation(handler)` | `Effect<void, never, R \| Scope>` | Register a handler that runs after navigation commits. |

### CurrentPath

`RefSubject.Computed<string>` — reactive current pathname + search (e.g. `"/about?tab=1"`). Built from `Navigation.currentEntry`.

### Layers

| Layer | Description |
|-------|-------------|
| `fromWindow(window?)` | Uses the browser `Window` history API. Defaults to `globalThis.window`. Requires `Ids` in context. |
| `memory(options)` | In-memory history from `MemoryOptions`: `entries`, `origin?`, `base?`, `currentIndex?`, `maxEntries?`, `commit?`. |
| `initialMemory(options)` | In-memory history with a single initial entry. `InitialMemoryOptions`: `url`, `origin?`, `base?`, `maxEntries?`, `state?`. |

### Blocking (unsaved changes, etc.)

| Export | Type | Description |
|--------|------|-------------|
| `useBlockNavigation(params?)` | `Effect<BlockNavigation, never, Navigation \| R \| Scope>` | When navigation is attempted, can block and show confirm/cancel/redirect. |
| `BlockNavigation` | interface | Extends `RefSubject.Filtered<Blocking>`; has `isBlocking: RefSubject.Computed<boolean>`. |
| `Blocking` | interface | Extends `BeforeNavigationEvent`; has `cancel`, `confirm`, `redirect(urlOrPath, options?)` effects. |
| `UseBlockNavigationParams` | interface | `shouldBlock?: (event) => Effect<boolean, RedirectError \| CancelNavigation, R>`. |

When a navigation is blocked, the handler receives a `Blocking` value; call `cancel` to abort, `confirm` to proceed, or `redirect(url, options?)` to redirect.

### Model types

| Type | Description |
|------|-------------|
| `Destination` | History entry: `id`, `key`, `url`, `state`, `sameDocument`. |
| `ProposedDestination` | Like `Destination` but without `id`/required `key`; used for “to” in transitions. |
| `NavigationType` | `"push"` \| `"replace"` \| `"reload"` \| `"traverse"`. |
| `Transition` | `type`, `from` (Destination), `to` (ProposedDestination), `info?`. |
| `BeforeNavigationEvent` | `type`, `from`, `delta`, `to`, `info`. |
| `NavigationEvent` | `type`, `destination`, `info`. |
| `NavigationError` | Error class; wraps underlying `error`. |
| `RedirectError` | Error class; `url`, `options?: { state?, info? }`. |
| `CancelNavigation` | Error class; no payload. |

### Handler types

- **BeforeNavigationHandler&lt;R, R2&gt;** — `(event: BeforeNavigationEvent) => Effect<Option<Effect<..., RedirectError | CancelNavigation, R2>>, RedirectError | CancelNavigation, R>`. Return `Option.some(redirectEffect)` to redirect, or fail with `RedirectError`/`CancelNavigation` to redirect or cancel.
- **NavigationHandler&lt;R, R2&gt;** — `(event: NavigationEvent) => Effect<Option<Effect<..., never, R2>>, never, R>`. Return `Option.some(effect)` to run after commit.

### Core utilities

| Export | Type | Description |
|--------|------|-------------|
| `getUrl(origin, urlOrPath)` | `(origin: string, urlOrPath: string \| URL) => URL` | Resolve `urlOrPath` against `origin`; returns a `URL`. |
| `NavigationState` | type | Internal state: `entries`, `index`, `transition`. |
| `makeNavigationCore` | Effect | Low-level constructor for custom navigation backends; not typically used directly. |
