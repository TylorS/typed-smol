---
title: Hydrating Typed HTML
summary: Adopt compatible Typed SSR output below one DOM host, or construct fresh output when the adoption contract does not match.
section: DOM and platform
kind: guide
order: 6.3
---

Hydration is a DOM task, not an HTTP feature. HtmlRenderTemplate emits the template and dynamic-range
markers; render with DomRenderTemplate searches for compatible markers below one host and wires the
existing nodes. It does not attach behavior to arbitrary static HTML.

## Use the normal DOM entry point

The host must contain HTML made from the same Typed template. render creates the hydration context
from that host automatically.

~~~ts
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Effect, Layer } from "effect";

const page = html`<main><h1>Hydratable page</h1></main>`;
const host = document.getElementById("app");
if (host === null) throw new Error("missing #app host");

await render(page, host).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
);
~~~

The top-level await is appropriate for this long-lived browser entry: Layer.launch retains the
host-bound render. The render owns its subscriptions and listeners, not the surrounding document.

## Adoption is exact or fresh

On a compatible match, the original Node objects remain in place and receive the DOM parts and event
listeners from the browser render. Missing markers, a different template hash, or a structural
server/client difference stop adoption. If wiring fails after it starts, Typed closes the partial
child scope and constructs that range fresh.

That fallback keeps the page usable, but it loses node identity and browser-managed state in the
failed range. Do not remove or manufacture the comments: they are renderer metadata, not
application IDs. When state crosses the boundary, use a hydration-aware value such as
RefSubject.hydrate so an invalid serialized value remains a typed failure.

## Advanced integrations

makeHydrateContext is public for a renderer integration that owns the marker cursor and the render
lifetime. It is not normal application state. Ordinary DOM code should call render as above.

For SSR response modes and an identity-and-interaction test, see
[Server rendering and hydration](/explore/server-rendering-and-hydration).
