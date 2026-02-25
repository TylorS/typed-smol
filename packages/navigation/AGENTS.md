# @typed/navigation

## Intent

Effect-based abstraction over the browser history API and in-memory history. Provides typed control over navigation state and actions: reactive `currentEntry`, `entries`, `transition`, `canGoBack`, `canGoForward` via RefSubject; lifecycle hooks (`onBeforeNavigation`, `onNavigation`) for intercepting, redirecting, or canceling; and `useBlockNavigation` for blocking unsaved changes with confirm/cancel/redirect. Supports push, replace, traverse, and reload. Acts as the foundation for `@typed/router` (BrowserRouter/ServerRouter/TestRouter) and is consumed by `@typed/ui` (Link, HttpRouter).

## Key exports / surfaces

- **Navigation** — core service; reactive `currentEntry`, `entries`, `transition`, `canGoBack`, `canGoForward`; actions `navigate`, `back`, `forward`, `traverseTo`, `updateCurrentEntry`, `reload`; hooks `onBeforeNavigation`, `onNavigation`
- **fromWindow**, **memory**, **initialMemory** — layers: browser history vs in-memory (tests, SSR)
- **useBlockNavigation** — blocking for unsaved changes; returns `BlockNavigation` with `cancel`, `confirm`, `redirect`
- **CurrentPath** — derived reactive pathname + search from `currentEntry`
- **Model types** — `Destination`, `Transition`, `BeforeNavigationEvent`, `NavigationEvent`, `RedirectError`, `CancelNavigation`, `NavigationError`

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for full API reference
- Router depends on navigation; `Router` = `CurrentRoute | Navigation`; BrowserRouter uses `fromWindow`, ServerRouter/TestRouter use `memory`/`initialMemory`
- UI Link and HttpRouter use navigation (Link for programmatic/click navigation; HttpRouter uses `initialMemory` for server requests)
- Root AGENTS.md for bootup/modes
