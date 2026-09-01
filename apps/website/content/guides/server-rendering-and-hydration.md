---
title: Server rendering and hydration
summary: Send buffered or streamed Typed HTML from Effect HTTP, then adopt that same inner template in the browser.
section: Applications
kind: guide
order: 8
---

SSR has two separate jobs:

1. A server renders a Typed matcher to HTML for one HTTP response.
2. A browser later adopts compatible HTML below its mount element and starts live DOM rendering.

The server uses HtmlRenderTemplate. The browser uses DomRenderTemplate. Both run the same template
program; neither turns arbitrary existing HTML into a Typed application.

## Choose buffered or streaming HTTP

For Typed route matchers, use the public HTTP helpers from @typed/ui/HttpRouter. There is no
ssrToHttp helper:

- ssrForHttp buffers a complete HTML body before returning the response.
- streamingSsrForHttp sends ordered HTML chunks as they are rendered.

Both register GET routes on Effect's HttpRouter and require HtmlRenderTemplate. Choose one based on
the response contract; do not wrap the buffered helper in a second stream.

~~~ts
// Buffered: one complete body.
import { HtmlRenderTemplate } from "@typed/template";
import { ssrForHttp } from "@typed/ui/HttpRouter";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { routes } from "./routes.js";

export const httpRoutes = HttpRouter.use(ssrForHttp(routes)).pipe(
  Layer.provide(HtmlRenderTemplate),
);
~~~

~~~ts
// Streaming: ordered chunks written through Effect HTTP's response stream.
import { HtmlRenderTemplate } from "@typed/template";
import { streamingSsrForHttp } from "@typed/ui/HttpRouter";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { routes } from "./routes.js";

export const httpRoutes = HttpRouter.use(streamingSsrForHttp(routes)).pipe(
  Layer.provide(HtmlRenderTemplate),
);
~~~

The helpers retain route decoding, guards, typed render failures, and request cancellation. The
streaming helper owns the HTTP response stream; client cancellation interrupts the renderer and
runs its finalizers.

For a non-HTTP task, use renderToHtmlString for a complete string or renderToHtml for ordered
strings. They are the underlying buffered and streaming primitives, respectively.

## Keep one hydratable inner tree

The browser must render the same inner template that the server put in its mount. When a server
returns a complete document, give that tree a nested host. A leading root marker can be moved by the
HTML parser; markers inside the host remain available to hydration. display: contents avoids adding
a layout box.

~~~ts
// shared.ts
import { html } from "@typed/template";

export const app = html`<main>
  <h1>Typed page</h1>
  <button id="save">Save</button>
</main>`;
~~~

~~~ts
// server document template
import { html } from "@typed/template";
import { app } from "./shared.js";

export const documentPage = html`<html>
  <head><title>Typed page</title></head>
  <body>
    <div id="app" style="display: contents">${app}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
~~~

The document shell is server output. The browser owns only the inner app host:

~~~ts
// client.ts
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Effect, Layer } from "effect";
import { app } from "./shared.js";

const host = document.getElementById("app");
if (host === null) throw new Error("missing #app host");

await app.pipe(
  render(host),
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
);
~~~

This top-level await is intentionally long-lived: Layer.launch keeps the host-bound render running
until its owning runtime stops. A test or another host can run the same Effect with a different
lifetime; do not hide runPromise inside the template or an adapter.

## What hydration proves

Hydratable HTML contains renderer-owned comments for a template hash, dynamic node ranges, and
keyed many() items. render derives the hydration context from its host and adopts DOM only when
those markers match. It preserves the matched Node objects and installs DOM parts and listeners.

If the host has no compatible root, or a renderer hydration error occurs while wiring a range,
Typed abandons adoption for that range and constructs fresh DOM. The page can continue, but node
identity and browser-managed state in that range are lost. A removed marker or different
server/client template shape is a defect to fix, not a recovery strategy.

Ordinary dynamic data is contextually escaped. HtmlRenderEvent is different: it carries
renderer-owned, trusted markup. Do not use it for request data or user input. See
[trusted HTML output](/integrate/html-output) for that boundary.

## Verify the handoff

Test the response mode separately from browser adoption:

- buffered route: assert its complete HTML response and status;
- streaming route: assert ordered chunks and request cancellation;
- browser: parse server output, hydrate the inner host, then assert identity and the interaction
  that matters for the page.

The template package's hydration tests cover this last boundary directly. Add a browser test for
focus, selection, custom-element lifecycle, or keyed movement when that native state matters.
