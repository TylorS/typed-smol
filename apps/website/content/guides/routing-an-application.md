---
title: Routing an application
summary: Build a small browser application whose visible page follows a typed URL.
section: Applications
kind: guide
order: 7
---

An issue tracker needs two browser addresses: the list at `/` and an issue at
`/issues/:id?tab=:tab?`. The route table below is the application boundary between those URL
inputs and rendered output. It does not fetch data or own an HTTP server; each handler only selects
the page for the current location.

## Select the page

`Matcher` is an `Fx`. It observes Navigation, runs the matching handler, and replaces obsolete
route work when the location changes. The issue handler receives reactive decoded parameters, so a
tab-only navigation updates the rendered value instead of closing over the first URL.

```ts
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import { html } from "@typed/template";
import { Link } from "@typed/ui/Link";

const Issue = Router.Parse("/issues/:id?tab=:tab?");

const appRoutes = Router.empty
  .match(
    Router.Slash,
    html`<main>
      <h1>Issues</h1>
      ${Link({ href: "/issues/42?tab=activity", content: "Open issue 42" })}
    </main>`,
  )
  .match(Issue, (params) =>
    Fx.map(
      params,
      ({ id, tab }) =>
        html`<main>
          <nav>${Link({ href: "/", content: "All issues" })}</nav>
          <h1>Issue ${id}</h1>
          <p>${tab ?? "overview"}</p>
        </main>`,
    ),
  )
  .match(Router.Wildcard, html`<main><h1>Not found</h1></main>`);
```

`Link` remains a native anchor. An eligible same-origin primary click calls Navigation; modifier
clicks, downloads, non-self targets, external URLs, and a user handler that prevents the event keep
their browser behavior. Put narrow routes before generic ones and `Wildcard` last: matching and
candidate fallback are ordered.

## Start the browser application

The app starts where its DOM renderer and browser router are provided. The Layer Scope owns the live
route subscription, active handler, DOM event work, and browser history listener until the
application stops.

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import { DomRenderTemplate, html, render } from "@typed/template";

const appRoutes = Router.empty.match(Router.Slash, html`<main><h1>Issues</h1></main>`);

await appRoutes.pipe(
  render(document.body),
  Fx.drainLayer,
  Layer.provide(Router.BrowserRouter(window)),
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
);
```

That is the whole browser wiring. The [Route guide](/explore/route-typed-url-inputs) covers URL
grammar and schema decoding; [Router + Navigation](/explore/router-navigation-live-selection) covers
BrowserRouter, ServerRouter, TestRouter, history actions, and scoped hooks. HTML rendering,
hydration, and Effect HTTP are separate output and transport concerns.
