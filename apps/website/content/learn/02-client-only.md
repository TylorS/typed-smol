---
id: "client-only"
title: "Render client-only markup"
summary: "Describe the view as a Typed template, then choose the DOM renderer at the edge."
order: 2
---

The template is renderer-independent. DomRenderTemplate is supplied only where the
program is launched, so the view does not import a browser singleton or own document.body.

### src/main.ts: mount the view

```ts file="src/main.ts"
import { Fx } from "@typed/fx"
import { DomRenderTemplate, html, render } from "@typed/template"
import { Effect, Layer } from "effect"

const Counter = html`<main>
  <h1>Counter</h1>
  <output>0</output>
</main>`

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
)
```
