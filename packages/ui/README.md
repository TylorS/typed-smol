# @typed/ui

> **Beta:** This package is in beta; APIs may change.

`@typed/ui` is the **web integration and headless component layer** for `@typed/router` and `@typed/template`. It bridges typed-smol's routing and template system with the browser, Effect's HTTP stack, and RefSubject-backed UI primitives.

## Capabilities

- **Link** — A typed anchor component that intercepts same-origin clicks and navigates via `Navigation.navigate` instead of a full page reload. Keeps routing SPA-style while preserving normal `<a>` semantics (href, target, keyboard, right-click).
- **Accessible primitives** — First tranche of Ariakit-style, Typed-native primitives: `Disclosure`, `Dialog`, and native `Popover`.
- **State substrate** — Component state is a direct `RefSubject.RefSubject<State>`. There is no separate Store abstraction.
- **Data attributes** — `DataAttr` encodes public `.data={object}` state through Effect Schema for stable styling and inspection attributes.
- **Startup refs** — `StartupRef` hydrates backing `RefSubject`s from server-emitted DOM `data-*` state during startup.
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
- **DataAttr:** `DataAttr.schema(fields)` defines a whole `.data={object}` shape from string keys to Effect Schema fields; `encode` returns string data values and `decode` reads plain objects or DOM `dataset`.
- **State:** `State.tag(id)` creates an Effect `Context.Service` key for passing the same `RefSubject` through context when provider lookup is useful.
- **StartupRef:** `StartupRef.fromData(ref, data)` decodes DOM `data-*` state and merges it into an existing `RefSubject`; `StartupRef.compose(...)` combines multiple startup refs for one template `ref`.
- **Disclosure:** `Disclosure.makeState`, `Disclosure.Button`, and `Disclosure.Content` provide headless disclosure state, APG button attributes, `hidden` content, and public `data-open`.
- **Dialog:** `Dialog.makeState`, `Dialog.Trigger`, `Dialog.Content`, and `Dialog.Close` provide modal dialog semantics, open/close state, focus return to the invoker, and public `data-open`.
- **Popover:** `Popover.makeState`, `Popover.Trigger`, and `Popover.Content` render native `popovertarget`, `popovertargetaction`, and `popover` attributes and mirror native `toggle` events into state.
- **SSR:** `ssrForHttp(router, matcher)` — registers route handlers on an Effect **HttpRouter** for server-side rendering; `handleHttpServerError(router)` — global middleware for HTTP server errors.

`Popover` intentionally uses only the native HTML Popover API. It does not add a custom overlay, custom focus trap, JS click toggle, positioning engine, or fallback implementation.

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
