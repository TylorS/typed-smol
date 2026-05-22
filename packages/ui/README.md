# @typed/ui

> **Beta:** This package is in beta; APIs may change.

`@typed/ui` is the **web integration and headless component layer** for `@typed/router` and `@typed/template`. It bridges typed-smol's routing and template system with the browser, Effect's HTTP stack, and RefSubject-backed UI primitives.

## Capabilities

- **Link** — A typed anchor component that intercepts same-origin clicks and navigates via `Navigation.navigate` instead of a full page reload. Keeps routing SPA-style while preserving normal `<a>` semantics.
- **SSR** — `ssrForHttp` compiles a router Matcher into HttpRouter GET handlers for server-side rendering. `handleHttpServerError` adds global middleware for 404/400/500.
- **State substrate** — Component state is direct `RefSubject.RefSubject<State>`. There is no separate Store abstraction.
- **DOM/data substrate** — `Dom`, `DataAttr`, `StartupRef`, `State`, `Collection`, and `Composite` support element-backed options, Schema-backed public `data-*` state, server-startup ref hydration, scope-owned registration, and APG-style composite navigation.
- **Accessible primitives** — `Disclosure`, `Dialog`, and native `Popover`.
- **Layered and proof widgets** — `Menu`, `Tabs`, `RadioGroup`, and `Toolbar` compose the substrate into Ariakit-like Typed primitives.

## Dependencies

- `effect`
- `@effect/platform-node`
- `@typed/fx`
- `@typed/navigation`
- `@typed/router`
- `@typed/template`
- `happy-dom` (dev)

## API overview

- **Link:** `Link(options)` renders an `<a href="...">` that intercepts same-origin, same-document clicks and calls `Navigation.navigate` instead of a full page load.
- **DataAttr:** `DataAttr.schema(fields)` defines a whole `.data={object}` shape from string keys to Effect Schema fields; `encode` returns string data values and `decode` reads plain objects or DOM `dataset`.
- **State:** `State.tag(id)` creates an Effect `Context.Service` key for passing the same `RefSubject` through context when provider lookup is useful.
- **StartupRef:** `StartupRef.fromData(ref, data)` decodes DOM `data-*` state and merges it into an existing `RefSubject`; `StartupRef.compose(...)` combines multiple startup refs for one template `ref`.
- **Collection:** `Collection.makeState` and `Collection.register` track item metadata. Registration is scoped and unregisters when the owning `Scope` closes.
- **Composite:** `Composite.makeState`, movement helpers, roving tabindex helpers, and virtual-focus helpers provide reusable APG-style active item behavior.
- **Disclosure:** `Disclosure.makeState`, `Disclosure.Button`, and `Disclosure.Content` provide headless disclosure state, APG button attributes, `hidden` content, and public `data-open`.
- **Dialog:** `Dialog.makeState`, `Dialog.Trigger`, `Dialog.Content`, and `Dialog.Close` provide modal dialog semantics, open/close state, focus return to the invoker, and public `data-open`.
- **Popover:** `Popover.makeState`, `Popover.Trigger`, and `Popover.Content` render native `popovertarget`, `popovertargetaction`, and `popover` attributes and mirror native `toggle` events into state.
- **Menu:** `Menu.makeState`, `Menu.Trigger`, `Menu.Content`, and `Menu.Item` provide a native-Popover-backed menu layer with APG menu roles, active item state, disabled item data, and composite movement helpers.
- **Tabs / RadioGroup / Toolbar:** First composite-backed proof widgets.
- **SSR:** `ssrForHttp(router, matcher)` registers route handlers on an Effect **HttpRouter** for server-side rendering; `handleHttpServerError(router)` handles HTTP server errors.

`Popover` intentionally uses only the native HTML Popover API. It does not add a custom overlay, custom focus trap, JS click toggle, positioning engine, or fallback implementation.

## Layered component direction

The component layer is native-platform-first. Modal behavior belongs to native `<dialog>`/`showModal()` and non-modal layered UI belongs to the HTML Popover API. Future Select/Listbox and Combobox work should build on `Collection`, `Composite`, `Menu`, native Popover where appropriate, and public Schema-backed `data-*` state.

CSS Anchor Positioning is an explicit goal for future Popover/Menu examples. `@typed/ui` should expose stable DOM attributes and state hooks that let users apply native `anchor-name`, `position-anchor`, and `position-area` CSS without requiring a custom JavaScript positioning engine.

## API reference

### `Link`

Renders an `<a href="...">` that intercepts same-origin, same-document clicks and navigates via `Navigation.navigate` instead of a full page load. Requires **Navigation** and **RenderTemplate** in the Effect context.

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
| `content` | `Renderable<string \| number \| boolean \| null \| undefined \| void \| RenderEvent, any, any>` | Yes      | Link body.                                                        |
| `replace` | `boolean`                                                                                       | No       | If `true`, use history replace instead of push. Default: `false`. |

In addition, `LinkOptions` accepts standard anchor event handlers, `ref`, and other writable `HTMLAnchorElement` properties. Custom `onclick` runs first; if the event is not `preventDefault`'d, the built-in navigation handler runs.

### `ssrForHttp`

Registers route handlers on an Effect **HttpRouter** for server-side rendering. The matcher's routes are compiled and each case is exposed as a GET route; requests are parsed, matched, and the corresponding Fx is rendered to HTML.

### `handleHttpServerError`

Adds global middleware to an **HttpRouter** that catches `HttpServerError` and returns appropriate HTTP responses:

| Error reason                      | Status |
| --------------------------------- | ------ |
| `RouteNotFound`                   | 404    |
| `RequestParseError`               | 400    |
| `InternalError` / `ResponseError` | 500    |

## Example

```ts
import { Link } from "@typed/ui";
import { html } from "@typed/template";

const nav = html`<nav>
  ${Link({ href: "/", content: "Home" })} ${Link({ href: "/todos", content: "Todos" })}
</nav>`;
```
