---
title: Rendering HTML on the server
summary: Serialize a template to HTML chunks or one string without coupling it to HTTP transport.
section: DOM and platform
kind: guide
order: 6.2
---

An email renderer, static export, or server adapter needs HTML—not DOM nodes. `HtmlRenderTemplate`
is the Template target that serializes RenderEvent output. It does not register request paths, set
response status, or mount a browser client.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { HtmlRenderTemplate, html, renderToHtml, renderToHtmlString } from "@typed/template";

const page = html`<main><h1>Hello</h1></main>`;

const chunks = renderToHtml(page).pipe(Fx.provide(HtmlRenderTemplate));

const completePage = Effect.scoped(
  renderToHtmlString(page).pipe(Effect.provide(HtmlRenderTemplate)),
);
```

`renderToHtml` emits ordered strings and lets a capable transport stream them. `renderToHtmlString`
collects every chunk before it succeeds, so its memory cost grows with the response. Both retain
typed renderer failures and required services.

Use `StaticHtmlRenderTemplate` for output that will never be adopted by the Typed DOM renderer; it
omits hydration markers. Use `HtmlRenderTemplate` for hydratable output. An HTTP server that needs
to turn a Matcher into GET responses is a separate concern:
[integrating Matcher with Effect HTTP](/explore/integrating-matcher-with-effect-http).

See [renderToHtml](/reference/%40typed%2Ftemplate%2FHtml%23renderToHtml), [renderToHtmlString](/reference/%40typed%2Ftemplate%2FHtml%23renderToHtmlString), and [StaticHtmlRenderTemplate](/reference/%40typed%2Ftemplate%2FHtml%23StaticHtmlRenderTemplate).
