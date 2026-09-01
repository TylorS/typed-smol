---
title: Integrating Matcher with Effect HTTP
summary: Register typed Matcher output as buffered or streaming GET HTML routes.
section: Integration
kind: guide
order: 10.2
---

Your Effect HTTP server already has a page Matcher and needs GET responses. `@typed/ui` provides
that adapter. Template serializes output; `ssrForHttp` and `streamingSsrForHttp` own the HTTP
registration, request-local navigation, and response shape.

There is **no public `ssrToHttp` alias**. Use `ssrForHttp` for a complete buffered body.

```ts
import { Layer } from "effect";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { Parse, match } from "@typed/router";
import { HtmlRenderTemplate, html } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui";

const pages = match(Parse("/"), html`<h1>Home</h1>`);

const HttpPages = HttpRouter.use(ssrForHttp(pages)).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(HtmlRenderTemplate),
);
```

The adapter registers GET routes and creates request-local memory Navigation and CurrentRoute from
each request URL. It applies the same route decoding and guard order as the client matcher; path
parameters win when a query repeats the same key. `handleHttpServerError` converts typed request
parse and not-found failures to safe 400/404 responses without swallowing application failures.

Use `streamingSsrForHttp` when the host can stream and time-to-first-byte matters:

```ts
import { Layer } from "effect";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { Parse, match } from "@typed/router";
import { HtmlRenderTemplate, html } from "@typed/template";
import { streamingSsrForHttp } from "@typed/ui/HttpRouter";

const pages = match(Parse("/"), html`<h1>Streamed home</h1>`);

const StreamingPages = HttpRouter.use(streamingSsrForHttp(pages)).pipe(
  Layer.provide(HtmlRenderTemplate),
);
```

Streaming preserves matching behavior but sends renderer chunks before the full page completes;
client cancellation interrupts the request stream. For the HTML conversion itself, see
[rendering HTML on the server](/explore/rendering-html-on-the-server).

See [ssrForHttp](/reference/%40typed%2Fui%23ssrForHttp), [streamingSsrForHttp](/reference/%40typed%2Fui%23streamingSsrForHttp), and [handleHttpServerError](/reference/%40typed%2Fui%23handleHttpServerError).
