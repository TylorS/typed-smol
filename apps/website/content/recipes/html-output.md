---
slug: html-output
title: Pass trusted HTML into Typed SSR
summary: Preserve a renderer's serialized output and its real chunk boundaries.
---

`HtmlRenderEvent(html, last)` carries HTML already produced by a trusted renderer. Use it for an SSR
adapter, not for application strings or user input.

## One complete render

When the renderer returns one complete string, emit one event with `last: true`.

```ts
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const htmlString = "<article><h1>Typed</h1></article>";
const output = Fx.sync(() => HtmlRenderEvent(htmlString, true));
```

`Fx.sync` keeps serialization lazy: the renderer runs for each subscription, not when the module loads.

## Trusted output is different from data

Typed templates escape ordinary interpolated strings. `HtmlRenderEvent` deliberately bypasses that escaping
because its `html` field is already markup.

Construct it only inside code that owns the serializer. Do not accept an arbitrary string from a caller and
rename it “trusted.” If the value is data, keep it as data:

```ts
import { html } from "@typed/template";

const search = '<img src=x onerror="alert(1)">';
const page = html`<p>${search}</p>`;
```

The template renderer escapes `search`. Wrapping the same value in `HtmlRenderEvent` would opt out of that
protection.

## Ordered chunks

`last` marks the final chunk of one logical render. It is not a generic stream-completion flag. A renderer
that already exposes ordered chunks can preserve that protocol directly:

```ts
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const output = Fx.fromIterable([
  HtmlRenderEvent("<article>", false),
  HtmlRenderEvent("<h1>Typed</h1>", false),
  HtmlRenderEvent("</article>", true),
]);
```

A non-empty render has exactly one terminal event. An empty render emits nothing. A failed or interrupted
render does not invent a terminal chunk. If a foreign streaming API reports only completion, buffer one
pending chunk in that adapter so completion can mark the real final value; keep that protocol-specific code
out of ordinary recipes.

## Send it through Effect HTTP

At the HTTP edge, project the events back to bytes and let Effect own the response stream.

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

const rendered = Fx.fromIterable([
  HtmlRenderEvent("<main>", false),
  HtmlRenderEvent("Typed</main>", true),
]);

const body = rendered.pipe(
  Fx.map((event) => event.html),
  Fx.toStream,
  Stream.encodeText,
);

export const response = HttpServerResponse.stream(body, {
  headers: { "content-type": "text/html; charset=utf-8" },
});
```

Applications using Typed routes normally call `ssrForHttp` for buffered output or
`streamingSsrForHttp` for streaming output. Those helpers connect template rendering to Effect's
`HttpRouter`; an adapter should not invent its own response type.

## Cleanup and failure

The renderer that opens a stream also closes it. Its Fx carries expected rendering failures in `E`, required
services in `R`, and finalizers in the run's Scope. `HtmlRenderEvent` itself owns no resource; it records a
trusted chunk and whether that chunk finishes the render.

## Related APIs

- [`HtmlRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23HtmlRenderEvent)
- [`streamingSsrForHttp`](/reference/%40typed%2Fui%2FHttpRouter%23streamingSsrForHttp)
- [Effect `HttpServerResponse`](https://effect.website/docs/v4/api/effect-unstable-http/HttpServerResponse)
