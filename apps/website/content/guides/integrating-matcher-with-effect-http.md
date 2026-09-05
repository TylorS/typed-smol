---
title: "Integrating Matcher with Effect HTTP"
summary: "Register typed Matcher output as buffered or streaming GET HTML routes."
section: "Integration"
kind: "guide"
order: 10.2
---

A page Matcher describes which renderable belongs to each URL. `@typed/ui/HttpRouter` adapts
that same route table to an Effect HTTP server. Template serializes output; `ssrForHttp` and `streamingSsrForHttp` own the HTTP
registration, request-local navigation, and response shape.

## Register a buffered page matcher

Use `ssrForHttp` when the response should contain one complete HTML body before it is sent.

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
parameters win when a query repeats the same key. `handleHttpServerError` maps structured request-parse, not-found, and server failures to empty
400, 404, or 500 responses. It leaves other application failures in the request error channel.

## Choose streaming deliberately

Use `streamingSsrForHttp` when the host can stream and early HTML delivery matters:

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


## Run the route layer on Node

Registration describes routes; it does not bind a port. An executable Node entry point also
supplies the HTML renderer, serves the routes, and provides the Node server layer:

```ts
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as Http from "node:http";
import { match, Parse } from "@typed/router";
import { HtmlRenderTemplate, html } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui/HttpRouter";

const pages = match(Parse("/"), html`<!doctype html>
  <html lang="en">
    <head><meta charset="utf-8" /><title>Typed server</title></head>
    <body><main><h1>Hello from Typed</h1></main></body>
  </html>`);

const Routes = HttpRouter.use(ssrForHttp(pages)).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(HtmlRenderTemplate),
);

Routes.pipe(
  HttpRouter.serve,
  Layer.provide(NodeHttpServer.layer(Http.createServer, { port: 3000 })),
  Layer.launch,
  NodeRuntime.runMain,
);
```

This serves the page at `/`. A real site also needs asset routes, a deployment base, and a browser
entry point if the HTML is interactive. The adapter does not generate or inject a client bundle.
Follow [server rendering and hydration](/explore/server-rendering-and-hydration) for that handoff.
For HTML that will never hydrate, provide `StaticHtmlRenderTemplate` instead of `HtmlRenderTemplate`.

## Keep request data inside the request lifetime

The adapter captures services when routes are registered, then combines them with the active
request's services. Shared services such as a database pool belong in the server layer. User
identity, cookies, and request metadata belong to request handling; do not put one request's user
in a process-wide mutable service. Candidate dependencies, guards, layouts, and recovery still
compose through the [Matcher contract](/explore/router-navigation-live-selection).

Each request gets memory Navigation and CurrentRoute, with UUIDv7 state provided by the adapter.
You do not need `IdsTest` or `TestRouter` in a production server. Sharing an application route table
is useful; sharing one mutable history instance across HTTP requests is not.

The adapter registers GET HTML routes. Add mutation endpoints through Effect HTTP's own routing
and decoding APIs. A browser form's `onValidSubmit` still needs a real client request to such an
endpoint, and the endpoint must validate and authorize it independently.

## Put failures on the correct side of the response boundary

Routes with the same registered path are tried in compiled candidate order. A decode failure or a
rejected guard can allow another candidate; a selected handler's rendering failure is not a reason
to try an unrelated page. If selection exhausts decoding candidates, the adapter produces a
request-parse failure; guard exhaustion becomes not-found. Decide whether application failures
should produce a page, an API error, or a logged server failure at the relevant application boundary.

Buffered rendering can fail before a response body is created. Streaming can fail after headers
and some HTML have been sent, when the server can no longer replace the entire response with a
fresh status page. Recover expected data failures within the rendered page when appropriate, and
test stream interruption and resource cleanup for the host that will actually serve it. HTML
streaming alone does not define a client protocol for later reactive updates.

## Test the adapter as an HTTP boundary

Keep route-codec and guard tests renderer independent, then add focused request tests for:

- GET status, `content-type`, and the rendered page for a valid path.
- Malformed declared parameters, repeated declared query keys, and unmatched routes.
- A request parameter that shares a name with a path capture; the path capture remains authoritative.
- Request-local services across two requests, including different users or request metadata.
- Expected application failures and interruption while consuming a streaming body.

The repository uses `NodeHttpServer.layerTest` for real request/response tests. This catches
registration and HTTP behavior that a direct call to `renderToHtmlString` cannot prove. See
[testing Typed systems](/explore/testing-typed-systems),
[HttpRouter](/reference/modules/%40typed%2Fui%2FHttpRouter), and
[Effect v4](https://effect.website/docs/v4).
