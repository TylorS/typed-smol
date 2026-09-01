---
title: Mounting DOM output
summary: Render a live RenderEvent Fx into one real browser root with an explicit lifetime.
section: DOM and platform
kind: guide
order: 6.1
---

You have a live page Fx and an `#app` element. `DomRenderTemplate` is the browser target that
creates real nodes, installs native listeners, and updates the supplied root. It does not select
routes or create HTTP responses.

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const page = html`<main><h1>Ready</h1></main>`;

await render(page, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
);
```

`render` makes the supplied element the local replacement boundary. The Layer Scope owns dynamic
subscriptions and listeners until the application stops. `DomRenderTemplate.using(document)` is
useful for a test document or iframe; the default layer uses the ambient document.

Server output is not DOM mounting: use [rendering HTML on the server](/explore/rendering-html-on-the-server).
To adopt compatible Typed server markup instead of creating fresh nodes, use
[hydrating Typed HTML](/explore/hydrating-typed-html).

See [DomRenderTemplate](/reference/%40typed%2Ftemplate%2FRender%23DomRenderTemplate) and [render](/reference/%40typed%2Ftemplate%2FRender%23render).
