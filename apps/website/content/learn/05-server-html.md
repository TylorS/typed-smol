---
id: "server-html"
title: "Render the same tree on the server"
summary: "Switch renderers at the composition edge and preserve one compatible inner template."
order: 5
---

HtmlRenderTemplate turns the Counter into renderer-owned HTML. Put that inner tree below
a stable host. The browser will render Counter into the host—not the surrounding document shell—so
Template can find its markers after the HTML parser has built the DOM.

### src/server.ts

```ts file="src/server.ts"
import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template"
import { Effect } from "effect"
import { Counter } from "./Counter.js"

const Document = html`<html>
  <body>
    <div id="app" style="display: contents">${Counter}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>`

export const markup = await renderToHtmlString(Document).pipe(
  Effect.provide(HtmlRenderTemplate),
  Effect.scoped,
  Effect.runPromise,
)
```
