# @typed/ui

> **Beta:** This package is in beta; APIs may change.

`@typed/ui` provides **web integration** for the router and template: **Link** (typed anchor that uses Navigation for same-origin clicks) and **HttpRouter**-related helpers for SSR (`ssrForHttp`, `handleHttpServerError`). Use it when you need navigation-aware links and/or server-side rendering of the router with Effect’s HTTP server.

## Dependencies

- `effect`
- `@effect/platform-node`
- `@typed/fx`
- `@typed/navigation`
- `@typed/router`
- `@typed/template`
- `happy-dom` (dev)

## API overview

- **Link** — `Link(options)` renders an `<a href="...">` that intercepts same-origin, same-document clicks and calls `Navigation.navigate` instead of a full page load. Options include `href`, `content`, `replace`, and standard anchor props. Requires **Navigation** and **RenderTemplate** in context (e.g. browser router).
- **SSR:** `ssrForHttp(router, matcher)` — registers route handlers on an Effect **HttpRouter** for server-side rendering; `handleHttpServerError(router)` — global middleware for HTTP server errors.

## Example

```ts
import { Link } from "@typed/ui";
import { html } from "@typed/template";

// In a template: link that navigates via Navigation (no full reload)
const nav = html`<nav>
  ${Link({ href: "/", content: "Home" })}
  ${Link({ href: "/todos", content: "Todos" })}
</nav>`;
```

For SSR, provide the router and matcher to `ssrForHttp` when setting up the HTTP server; see Effect’s `HttpRouter` and the TodoMVC example structure.
