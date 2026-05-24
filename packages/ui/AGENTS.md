# @typed/ui

## Intent

`@typed/ui` is the **web integration and headless component layer** for `@typed/router` and `@typed/template`. It owns Link, server rendering, RefSubject-backed state primitives, Schema-backed `data-*` state, StartupRef hydration, Collection/Composite substrate, and native Dialog/Popover-first layered widgets.

## Purpose

Bridges `@typed/router` + `@typed/template` with the browser, HTTP server, and headless UI state:

- **Link** — Renders `<a href="...">` elements that intercept same-origin clicks and call `Navigation.navigate` instead of a full reload, so routing stays SPA-style with typed routes.
- **SSR** — `ssrForHttp` and `handleHttpServerError` wire a Matcher to Effect's HttpRouter for server-side rendering and consistent error handling (404, 400, 500).
- **Headless primitives** — RefSubject-backed state, Schema-backed data attrs, StartupRef hydration, Collection/Composite navigation, and native Dialog/Popover-first widgets.

## Capabilities

| Area                  | APIs                            | Notes                                                                                                                                                                                      |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Client navigation** | `Link(options)`                 | `<a>` with `href`, `content`, `replace`; same-origin clicks -> `Navigation.navigate`; respects ctrl/meta/shift, `target`; custom `onclick` runs first, built-in handler if not prevented.   |
| **Server rendering**  | `ssrForHttp(router, matcher)`   | Compiles Matcher cases to GET routes on HttpRouter; parses URL and params, provides Scope + Router, runs handler Fx, renders to HTML; supports curried form `ssrForHttp(matcher)(router)`. |
| **Error handling**    | `handleHttpServerError(router)` | Global middleware: `RouteNotFound` -> 404, `RequestParseError` -> 400, `InternalError`/`ResponseError` -> 500.                                                                            |
| **State substrate**   | `State`, `DataAttr`, `StartupRef` | RefSubject services, Schema-backed public `data-*` state, and server-startup ref hydration.                                                                                            |
| **Headless widgets**  | `Collection`, `Composite`, `Disclosure`, `Dialog`, `Popover`, layered widgets | Native-platform-first primitives built from template-native state and DOM semantics.                                                                          |

## Mental model

- **Link**: Template + Navigation. Link is a `Renderable` that yields `<a>`. On click, it checks origin, modifiers, and target; if same-origin/default, it calls `nav.navigate(href, { history })` and prevents full reload.
- **SSR**: Matcher → routes → handlers. Each Matcher case becomes a GET route. Incoming requests are parsed, decoded, guarded; the matched Fx is run with Scope/Router and rendered via `renderToHtmlString`.
- **Headless components**: state lives in RefSubject values and DOM-visible state is encoded through Schema-backed `data-*` attributes, so widgets stay template-native and SSR/hydration friendly.

## Key exports / surfaces

- `Link`, `ssrForHttp`, `handleHttpServerError`
- `Dom`, `DataAttr`, `State`, `StartupRef`, `Collection`, `Composite`
- `Disclosure`, `Dialog`, `Popover`, `Hovercard`, `Tooltip`, `Combobox`
- `Menu`, `Menubar`, `Listbox`, `Select`, `Tabs`, `RadioGroup`, `Toolbar`
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
