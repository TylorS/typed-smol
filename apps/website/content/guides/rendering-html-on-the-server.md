---
title: "Rendering HTML on the server"
summary: "Serialize a template to HTML chunks or one string without coupling it to HTTP transport."
section: "DOM and platform"
kind: "guide"
order: 6.2
---

An email needs a complete string. An HTTP response may be able to send chunks. A page that will
become interactive needs hydration markers; an export does not. Make those two choices separately:
the renderer layer chooses the markup contract, and the consumer chooses buffering or streaming.

| Destination | Renderer | Consumer |
| --- | --- | --- |
| Email or static export | `StaticHtmlRenderTemplate` | usually `renderToHtmlString` |
| Interactive page, buffered response | `HtmlRenderTemplate` | `renderToHtmlString` |
| Interactive page, streamed response | `HtmlRenderTemplate` | `renderToHtml` |

## Produce a complete static document

Keep data as interpolations. An account name containing markup is text, not authored HTML.

```ts
import { Effect } from "effect";
import { html, renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";

const receipt = (name: string, total: string) => html`<article>
  <h1>Thank you, ${name}</h1>
  <p>Your order total is ${total}.</p>
</article>`;

export const renderReceipt = (name: string, total: string) =>
  receipt(name, total).pipe(
    renderToHtmlString,
    Effect.provide(StaticHtmlRenderTemplate),
    Effect.scoped,
  );
```

This function returns an Effect that succeeds with a string. It does not send mail or write a file.
The application runs it and passes the result to its destination. Static rendering omits Typed's
adoption metadata, so a later Typed browser mount will construct fresh output.

`renderToHtmlString` buffers all emitted strings before joining them. Use it when the complete body
is reasonably bounded or the destination requires a string. Its memory use grows with the document.

## Keep chunks when the destination can consume them

```ts
import { Fx } from "@typed/fx";
import { html, HtmlRenderTemplate, renderToHtml } from "@typed/template";

const productPage = html`<main>
  <h1>Desk lamp</h1>
  <p>Adjustable light for your workspace.</p>
</main>`;

export const productChunks = productPage.pipe(
  renderToHtml,
  Fx.provide(HtmlRenderTemplate),
);

// Hand this Stream to a response adapter that encodes strings as bytes.
export const productStream = productChunks.pipe(Fx.toStream);
```

The result is ordered strings, not HTTP messages. The response adapter still owns content type,
status, headers, encoding, and cancellation. If it buffers the Stream, you have not gained streaming
at the transport boundary. Chunk boundaries are implementation output, not application message
boundaries: a chunk need not contain a whole element.

Streaming also changes error timing. A buffered render can fail before a response body is committed.
Once a streaming transport has sent headers and part of the body, it cannot replace those bytes with
a different error page. Recover expected data failures before serialization when possible, and let
the server decide how to log and close a failed response. Keep request-scoped rendering work inside
the response consumer's lifetime so cancellation can interrupt it.

## A server render needs initial values

The HTML renderer reads the initial value of ordinary live inputs instead of subscribing forever.
That is a snapshot for one response, not a promise that every source produces a value immediately.
A source that never emits can stall its part. Resolve required request data, provide an intentional
initial value, or put a timeout/recovery policy around the relevant Effect.

A nested `HtmlRenderEvent` stream is different: it represents a sequence of renderer-owned chunks,
so its terminal marker and ordered completion must be honored rather than taking only its first
chunk. [Using HtmlRenderEvent](/explore/html-render-event) explains that protocol.

Errors and required services from interpolated Effects remain in the returned `E` and `R` channels.
Provide request-specific services at the request boundary; constructing the template does not run
the service call. Avoid putting request state into a module-global mutable subject.

## HTML represents only the serialized half of the view

The HTML renderer escapes ordinary dynamic text and attributes. Events and ordinary ref callbacks
do not run on the server. DOM property parts such as `.value` are not serialized as attributes;
provide an appropriate authored attribute as well when an initial control value must be visible
before the client runs. Hydration refs are the explicit exception that serialize state metadata.

`HtmlRenderEvent` asserts that another renderer already owns safe serialization. It does not
sanitize a string. Use normal interpolations for user data and reserve that output type for an
actual renderer adapter.

For an interactive page, the browser must mount the same inner template under a dedicated host.
[Hydrating Typed HTML](/explore/hydrating-typed-html) covers that handoff. The
[HTML output recipe](/integrate/html-output) adds Effect HTTP transport, and the
[Html module](/reference/modules/%40typed%2Ftemplate%2FHtml) documents both renderer layers and
consumers.
