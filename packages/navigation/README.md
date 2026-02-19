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
