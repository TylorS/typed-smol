---
title: "Hydrating Typed HTML"
summary: "Adopt compatible Typed SSR output below one DOM host, or construct fresh output when the adoption contract does not match."
section: "DOM and platform"
kind: "guide"
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

## Diagnose an apparently successful fresh render

Matching text is not enough to distinguish adoption from replacement. Before the client starts,
retain a reference to a server element. After rendering, compare it with the element in the same
position. If identity changed, inspect these boundaries in order:

1. Confirm the server used `HtmlRenderTemplate`, not `StaticHtmlRenderTemplate`.
2. Confirm the host contains the inner template's markers and the client renders that inner template.
3. Confirm the server and client use the same authored template shape and compatible renderer code.
4. Confirm HTML transformation, minification, or another owner did not remove or relocate the markers.
5. For keyed lists, confirm the same stable keys identify the initial items on both sides.

A template hash identifies authored structure, not your domain data. A server and browser can use
the same literal with different initial values. Use a hydration ref when the client must resume
server state, and test its schema decoding separately from DOM adoption. Do not catch invalid state
and silently describe it as successful hydration.

## Decide who owns pre-hydration edits

A visitor can type into an input before JavaScript starts. Adopting that input preserves its node,
but a `.value` part is still a writer for its live value and can apply the client state. Node identity
alone does not decide whether the user's edit or serialized application state wins.

For browser-owned initial editing, an authored `value` attribute supplies the default without making
a reactive property the ongoing writer. For application-controlled editing, restore the intended
state and explicitly decide how early edits are captured or reconciled. The same question applies
to checked state, focus, selection, and widget state that another library initializes before Typed.

Hydration refs run while the existing DOM is being wired. Ordinary refs may acquire browser resources
at that point, but a ref is not an after-paint hook. Keep measurement or focus policy in an adapter
that understands when its element is connected and laid out. See
[Reference the native element](/explore/template-references-and-element-access).
