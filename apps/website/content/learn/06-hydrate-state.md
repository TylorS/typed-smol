---
id: "hydrate-state"
title: "Hydrate state and adopt the DOM"
summary: "Serialize Schema-checked state on the server and restore it before live parts run."
order: 6
demo: "counter-hydrated"
---

RefSubject.hydrate is for state that crosses the server/browser boundary. Attach the
hydration ref to an element with ref. The server serializes its value there; the DOM renderer
decodes it before the count subscription and event handlers start. The browser fallback is not a
persistence strategy—it is used only when there is no compatible server value.

### src/Counter.ts: restore server state

```ts file="src/Counter.ts"
import { Fx, RefSubject } from "@typed/fx"
import { html } from "@typed/template"
import { Effect, Schema } from "effect"

export const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.hydrate(
    Schema.Finite,
    Effect.sync(() => typeof document === "undefined" ? 7 : 0),
  )

  return html`<section ref=${count}>
    <button onclick=${RefSubject.decrement(count)}>Decrease</button>
    <output aria-live="polite">${count}</output>
    <button onclick=${RefSubject.increment(count)}>Increase</button>
  </section>`
})
```

### src/client.ts

```ts file="src/client.ts"
import { Fx } from "@typed/fx"
import { DomRenderTemplate, render } from "@typed/template"
import { Effect, Layer } from "effect"
import { Counter } from "./Counter.js"

const host = document.getElementById("app")
if (host === null) throw new Error("Missing #app host")

await render(Counter, host).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
)
```
