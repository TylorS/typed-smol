---
title: "RenderEvent: any UI can participate"
summary: "Choose the output boundary that matches the renderer you already have."
section: "Integration"
kind: "concept"
order: 10
---

What should a renderer emit when it needs to participate in a Typed template? Emit
`Fx<RenderEvent, E, R>` and choose the representation it actually owns: live DOM nodes in the
browser, or trusted HTML chunks for server output.

## Choose the representation first

```ts
import { Fx } from "@typed/fx";
import { DomRenderEvent, HtmlRenderEvent } from "@typed/template/RenderEvent";

const canvas = document.createElement("canvas");
canvas.width = 640;
canvas.height = 320;
const domView = Fx.succeed(DomRenderEvent(canvas));

const htmlView = Fx.fromIterable([
  HtmlRenderEvent("<article><h1>Catalog</h1>", false),
  HtmlRenderEvent("<p>Rendered by the catalog service.</p></article>", true),
]);
```

`DomRenderEvent` carries the exact `Node`, `DocumentFragment`, `Wire`, or nested readonly
collection already produced by the renderer. `HtmlRenderEvent` carries one trusted string chunk
and its `last` marker. A DOM consumer should not serialize nodes just to recover them later; an HTML
consumer should not parse a string and pretend it had node identity.

The `Fx` channels remain visible at the boundary. `A` is the output, `E` is the expected failure
type, and `R` is the Effect service requirement. The [Effect type](https://effect.website/docs/v4/getting-started/the-effect-type/)
provides those channels; the running [Effect Scope](https://effect.website/docs/v4/resource-management/scope/)
owns the producer's subscriptions and cleanup. Creating an output value does not start or stop the
renderer that produced it.

## DOM output means identity

Use `DomRenderEvent` when the object itself matters: a custom element, media element, editor,
canvas, map, or output from an existing renderer. The receiving template may place, move, or remove
the represented nodes in its own dynamic range. It does not clone them, rewrite their descendants,
or claim the parent and siblings around that range.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const map = document.createElement("canvas");
map.dataset["renderer"] = "map";
const mapOutput = Fx.succeed(DomRenderEvent(map));
const page = html`<section aria-label="Price chart">${mapOutput}</section>`;
```

`DomRenderEvent` is output transport, not a mount API. If the foreign renderer has an imperative
`mount` and `dispose`, acquire and release those resources in the producer's Scope. See
[Using DomRenderEvent](/explore/dom-render-event) for the exact-node contract and
[Cooperative by design](/explore/cooperative-by-design) for the ownership rule around shared DOM.

## HTML output means trusted serialization

Use `HtmlRenderEvent` when another renderer already owns escaping and serialization. The HTML
consumer inserts `html` as renderer-owned transport, so the constructor deliberately performs no
sanitization. Never pass user content to it:

```ts
import { html } from "@typed/template";

const userName = "<script>alert('not markup')</script>";
const safe = html`<p>Hello, ${userName}</p>`;
```

Ordinary interpolation is the application-data path; the HTML renderer escapes the value in its
text context. Wrapping that same string in `HtmlRenderEvent` would make a false trust claim. See
[Using HtmlRenderEvent](/explore/html-render-event) for chunk ordering and completion.

## The boundary is compositional

Templates can consume either form through their renderer service:

```ts
import { html } from "@typed/template";
import { Fx } from "@typed/fx";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const widget = document.createElement("x-widget");
const output = Fx.succeed(DomRenderEvent(widget));
const composed = html`<main><aside>${output}</aside></main>`;
```

No `foreign.mount()` return type is assumed. The adapter models the foreign system's actual update
source, error path, service requirements, and teardown, then maps its output to `RenderEvent`. That
small boundary is enough for templates, routers, custom elements, and server renderers to compose.

If the renderer needs to branch on output, use the public `isDomRenderEvent` and
`isHtmlRenderEvent` guards. Do not infer representation by checking arbitrary object shape.

## Do not use one form for the other

- Use `DomRenderEvent` for live node identity and browser-managed state.
- Use `HtmlRenderEvent` for trusted, ordered server serialization.
- Use ordinary `html` interpolation for application data.
- Use a dedicated host or dynamic range when the surrounding DOM has another owner.

For the next implementation step, read [Mounting DOM output](/explore/mounting-dom-output) or
[rendering HTML on the server](/explore/rendering-html-on-the-server). For cost and identity
behavior after output enters a template, read [Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation).
