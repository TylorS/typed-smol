# @typed/ui

> **Beta:** This package is in beta; APIs may change.

`@typed/ui` is the **web integration layer** for `@typed/router` and `@typed/template`. It bridges typed-smol's routing and template system with the browser and Effect's HTTP stack.

## Capabilities

- **Link** — A typed anchor component that intercepts same-origin clicks and navigates via `Navigation.navigate` instead of a full page reload. Keeps routing SPA-style while preserving normal `<a>` semantics (href, target, keyboard, right-click).
- **SSR** — `ssrForHttp` compiles a router Matcher into HttpRouter GET handlers for server-side rendering. Requests are parsed, matched, and the corresponding Fx is rendered to HTML. `handleHttpServerError` adds global middleware for 404/400/500.

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

## API reference

### `Link`

Renders an `<a href="...">` that intercepts same-origin, same-document clicks and navigates via `Navigation.navigate` instead of a full page load. Requires **Navigation** and **RenderTemplate** in the Effect context (e.g. `BrowserRouter`).

```ts
function Link<const Opts extends LinkOptions>(
  options: Opts,
): Fx<
  RenderEvent,
  Renderable.ErrorFromObject<Opts>,
  Renderable.ServicesFromObject<Opts> | Scope | RenderTemplate
>;
```

**`LinkOptions`**

| Property  | Type                                                                                            | Required | Description                                                       |
| --------- | ----------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `href`    | `Renderable<string, any, any>`                                                                  | Yes      | Target URL.                                                       |
| `content` | `Renderable<string \| number \| boolean \| null \| undefined \| void \| RenderEvent, any, any>` | Yes      | Link body (text or template content).                             |
| `replace` | `boolean`                                                                                       | No       | If `true`, use history replace instead of push. Default: `false`. |

In addition, `LinkOptions` accepts standard anchor event handlers (e.g. `onclick`), `ref`, and other writable `HTMLAnchorElement` properties. Custom `onclick` runs first; if the event is not `preventDefault`'d, the built-in navigation handler runs.

---

### `ssrForHttp`

Registers route handlers on an Effect **HttpRouter** for server-side rendering. The matcher's routes are compiled and each case is exposed as a GET route; requests are parsed, matched, and the corresponding Fx is rendered to HTML. Requires **Router** and **Scope** to be provided elsewhere; other matcher services remain in the effect requirement.

**Overloads:**

```ts
// (router, matcher)
function ssrForHttp<E, R>(
  router: HttpRouter,
  input: Matcher<RenderEvent, E, R>,
): Effect.Effect<void, never, Exclude<R, Scope | Router>>;

// (matcher)(router) — curried
function ssrForHttp<E, R>(
  input: Matcher<RenderEvent, E, R>,
): (router: HttpRouter) => Effect.Effect<void, never, Exclude<R, Scope | Router>>;
```

- **`router`** — Effect `HttpRouter` to attach GET handlers to.
- **`input`** — A **Matcher** from `@typed/router` whose cases produce `RenderEvent` Fx (e.g. templates). Route path and query params are decoded and passed to the handler; `Scope` and `Router` are provided by the SSR pipeline.

---

### `handleHttpServerError`

Adds global middleware to an **HttpRouter** that catches `HttpServerError` and returns appropriate HTTP responses:

| Error reason                      | Status |
| --------------------------------- | ------ |
| `RouteNotFound`                   | 404    |
| `RequestParseError`               | 400    |
| `InternalError` / `ResponseError` | 500    |

```ts
function handleHttpServerError(router: HttpRouter): Effect.Effect<void, never, HttpRouter>;
```

Use after registering routes (e.g. after `ssrForHttp`) so unhandled route and parse errors are converted to 404/400/500 instead of failing the server.

## Example

```ts
import { Link } from "@typed/ui";
import { html } from "@typed/template";

// In a template: link that navigates via Navigation (no full reload)
const nav = html`<nav>
  ${Link({ href: "/", content: "Home" })} ${Link({ href: "/todos", content: "Todos" })}
</nav>`;
```

For SSR, provide the router and matcher to `ssrForHttp` when setting up the HTTP server; see Effect's `HttpRouter` and the TodoMVC example structure.
