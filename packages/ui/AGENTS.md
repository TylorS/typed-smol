# @typed/ui

## Intent

`@typed/ui` is the **web integration layer** for router and template: client-side navigation-aware links and server-side rendering of the router on Effect's HTTP stack. Use it when you need Link components that avoid full page reloads and/or SSR that compiles Matcher routes into HttpRouter handlers.

## Purpose

Bridges `@typed/router` + `@typed/template` with the browser and HTTP server:

- **Link** — Renders `<a href="...">` elements that intercept same-origin clicks and call `Navigation.navigate` instead of a full reload, so routing stays SPA-style with typed routes.
- **SSR** — `ssrForHttp` and `handleHttpServerError` wire a Matcher to Effect's HttpRouter for server-side rendering and consistent error handling (404, 400, 500).

## Capabilities

| Area                  | APIs                            | Notes                                                                                                                                                                                      |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Client navigation** | `Link(options)`                 | `<a>` with `href`, `content`, `replace`; same-origin clicks → `Navigation.navigate`; respects ctrl/meta/shift, `target`; custom `onclick` runs first, built-in handler if not prevented.   |
| **SSR wiring**        | `ssrForHttp(router, matcher)`   | Compiles Matcher cases to GET routes on HttpRouter; parses URL and params, provides Scope + Router, runs handler Fx, renders to HTML; supports curried form `ssrForHttp(matcher)(router)`. |
| **Error handling**    | `handleHttpServerError(router)` | Global middleware: `RouteNotFound` → 404, `RequestParseError` → 400, `InternalError`/`ResponseError` → 500.                                                                                |

## Mental model

- **Link**: Template + Navigation. Link is a `Renderable` that yields `<a>`. On click, it checks origin, modifiers, and target; if same-origin/default, it calls `nav.navigate(href, { history })` and prevents full reload.
- **SSR**: Matcher → routes → handlers. Each Matcher case becomes a GET route. Incoming requests are parsed, decoded, guarded; the matched Fx is run with Scope/Router and rendered via `renderToHtmlString`.

## Key exports / surfaces

- `Link`, `ssrForHttp`, `handleHttpServerError`
- Dependencies: `@typed/fx`, `@typed/navigation`, `@typed/router`, `@typed/template`, `effect`, `@effect/platform-node`

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`
- Effect unstable/http skills for HttpRouter, HttpServerRequest, HttpServerResponse, HttpServerError

## Pointers

- README for full API reference and examples
- Siblings: `@typed/router`, `@typed/template`, `@typed/navigation`
- Example: `examples/todomvc` (Link in nav, full stack)
- Root AGENTS.md for bootup/modes
