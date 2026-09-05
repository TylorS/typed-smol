---
id: "reactive-state"
title: "Own reactive state"
summary: "Let RefSubject own the count and pass Effects directly to native event bindings."
order: 3
demo: "counter-reactive"
---

A RefSubject is both current state and an Fx of later values. Interpolating it renders
the current count and keeps that dynamic part subscribed. The button handlers are ordinary Effects;
Template acquires and disposes their listeners with the render Scope.

### src/main.ts: add reactive state

```ts file="src/main.ts"
import { Fx, RefSubject } from "@typed/fx"
import { DomRenderTemplate, html, render } from "@typed/template"
import { Effect, Layer } from "effect"

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0)

  return html`<main>
    <h1>Counter</h1>
    <button onclick=${RefSubject.decrement(count)}>−</button>
    <output>${count}</output>
    <button onclick=${RefSubject.increment(count)}>+</button>
  </main>`
})

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
)
```
