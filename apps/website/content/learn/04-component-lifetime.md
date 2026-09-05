---
id: "component-lifetime"
title: "Extract the Counter lifetime"
summary: "Keep state construction inside the Fx that owns it and renderer choice outside."
order: 4
demo: "counter-component"
---

Counter acquires its RefSubject when a renderer subscribes. That Scope owns the state,
the dynamic output subscription, and every event listener. Moving the launch code to main.ts keeps
the component reusable in DOM tests, HTML rendering, and a larger application.

Move the Counter definition into `src/Counter.ts`. In `src/main.ts`, replace the local definition
with `import { Counter } from "./Counter.js"` and keep the existing render pipeline.

### src/Counter.ts: own the component lifetime

```ts file="src/Counter.ts"
import { Fx, RefSubject } from "@typed/fx"
import { html } from "@typed/template"

export const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0)
  const doubled = RefSubject.map(count, (value) => value * 2)

  return html`<section aria-labelledby="counter-title">
    <h1 id="counter-title">Counter</h1>
    <button onclick=${RefSubject.decrement(count)}>Decrease</button>
    <output aria-live="polite">${count}</output>
    <button onclick=${RefSubject.increment(count)}>Increase</button>
    <p>Twice the count: ${doubled}</p>
  </section>`
})
```
