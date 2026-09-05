---
title: "Server rendering and hydration"
summary: "Send buffered or streamed Typed HTML from Effect HTTP, then adopt that same inner template in the browser."
section: "Applications"
kind: "guide"
order: 8
---

An interactive server-rendered page has three cooperating owners: the server prepares response data,
the HTML renderer serializes a finite view, and the browser adopts that view and starts its live
subscriptions. Sharing the template is necessary; sharing the initial state and the exact mount
boundary is equally important.

## Make the inner application a reusable program

The server and browser should import the same application factory. Its state is created each time
it runs. A hydration ref lets the server's chosen initial value travel on the element that owns it.

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Schema } from "effect";

export const Counter = Fx.genScoped(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    Count: ${count}
  </button>`;
});
```

On the server, the HTML renderer serializes the initial count and its hydration envelope. On the
client, the ref restores that serialized value before the reactive text part starts. The button's
click handler runs only in the browser. The state remains a RefSubject; hydration is the handoff
protocol, not a separate state store.

In an application, obtain request data through an Effect service inside this setup. Keep the
service implementation request-scoped so concurrent requests cannot share a mutable user's state.
A browser may provide a different implementation, but its initial state must agree with the
serialized page or be restored from it.

## Put the inner view inside a stable document shell

The server owns the full response document. The browser owns the contents of one dedicated host.
This complete example puts hydration markers inside that host, where parsing a full HTML document
will retain the inner boundary.

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { Effect, Schema } from "effect";

const Counter = Fx.genScoped(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    Count: ${count}
  </button>`;
});

const documentPage = html`<!doctype html><html lang="en">
  <head><title>Server-rendered counter</title></head>
  <body>
    <div id="app">${Counter}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;

export const responseBody = documentPage.pipe(
  renderToHtmlString,
  Effect.provide(HtmlRenderTemplate),
  Effect.scoped,
);
```

Use the same `Counter` export in both entry points in a real project; it is repeated here so each
example is self-contained. Give the host ordinary layout styling, or `display: contents` when the
extra layout box is inappropriate. The shell's script URL and asset delivery belong to the
application's build and server configuration.

## Start the browser at the inner host

```ts
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Effect, Fiber, Schema } from "effect";

const Counter = Fx.genScoped(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 12);
  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    Count: ${count}
  </button>`;
});

const host = document.getElementById("app");
if (host === null) throw new Error("Missing #app host");

const application = Counter.pipe(
  render(host),
  Fx.drain,
  Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
  Effect.scoped,
);

const fiber = Effect.runFork(application);
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

`render` derives the hydration context from this host. It adopts matching template markers and
installs the button's DOM parts and listener on the existing node. Passing `documentPage` instead
would request the wrong shape below the host. Clearing `host.innerHTML` before mounting would
remove the very nodes and markers hydration needs.

The root is still a mount slot: rendering fresh output can replace its children. Put unrelated
widgets beside it, or inside a separately owned child host, rather than relying on hydration to
protect arbitrary root siblings.

## Choose the response transport independently

`renderToHtmlString` buffers a full body before it succeeds. `renderToHtml` exposes ordered strings
that a streaming transport can send as they arrive. Both preserve typed render failures and service
requirements, but a failure after streaming headers cannot change the already-sent response status.
Request cancellation must close the response's render work.

For a Typed route matcher, `ssrForHttp` and `streamingSsrForHttp` from `@typed/ui/HttpRouter` register
buffered and streamed GET responses on Effect's HttpRouter. They sit above this same renderer
boundary. See [Integrating Matcher with Effect HTTP](/explore/integrating-matcher-with-effect-http)
for route registration and [HTML output](/integrate/html-output) for a renderer adapter without a
matcher. Use `StaticHtmlRenderTemplate` only when the destination will not hydrate.

## Verify adoption and interaction separately

A successful HTML response proves serialization; matching final text in a browser does not prove
hydration. A fresh render can produce the same text. Capture the server button before starting the
client, wait for the client to attach, and assert the button is the same object. Then click it and
assert that its count changes from the serialized initial value. Finally interrupt the client and
assert later clicks no longer update state.

Add native-state assertions when they matter: an edited input's value, selection, focus, a custom
element's connection lifecycle, or a reordered keyed child's identity. Preserving a node is not a
promise that an explicitly controlled property will retain a user's pre-hydration write; its
reactive part remains the writer for that field.

If markers are missing, template hashes differ, or an adopted range cannot be wired, the renderer
can rebuild that range. The page may look correct while losing its original node identity. Treat
that as an integration failure to investigate, not evidence that hydration worked. Follow
[Hydrating Typed HTML](/explore/hydrating-typed-html) for a focused diagnosis, and
[Hydrated template state](/explore/refsubject-template-hydration) for schema and state-envelope
failures.
