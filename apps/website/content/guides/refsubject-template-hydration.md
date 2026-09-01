---
title: "Hydrate RefSubject state through Template"
summary: Carry Schema-checked RefSubject state from Typed HTML into the adopted browser DOM.
section: State
kind: guide
order: 2.04
---

`RefSubject.hydrate` is the hydration-aware form of RefSubject construction. It accepts the same
initial value shapes as `RefSubject.make`, but adds an Effect Schema codec and a `HydrationRef`
protocol. On the server it encodes the ref's current value into HTML; during Typed DOM hydration it
decodes that value before the ref's ordinary initializer continues.

Use it only for state that crosses this server-to-browser boundary. Use `RefSubject.make` for state
that begins and stays in one runtime. Hydration is not a general persistence mechanism: the browser
must be adopting compatible Typed HTML from the same template.

## Hydrate one state value on its element host

Pass the hydrated ref to Template's `ref` directive. The directive gives the HTML renderer an
attribute host and gives the DOM renderer the exact element from which it restores the value. The
ref remains ordinary writable state after hydration.

```ts
import { Effect, Schema } from "effect"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"

const counter = Effect.fn("counter")(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 0)

  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    ${count}
  </button>`
})
```

Unnamed hydrated refs are stored together in Typed's versioned `data-typed-refsubject` envelope.
The DOM renderer removes that consumed envelope after it decodes successfully. A decoding failure
remains a typed `Schema.SchemaError` on the ref; it is not silently converted into a different
client-side default.

## Combine related state with `hydrateAll`

`hydrateAll` produces one `HydrationRef` for several hydrated refs. Attach the combined value to
one element with `ref`; it serializes and restores every member before ordinary reactive parts run.
Unnamed members share one envelope. Named members use their own readable `data-*` attributes and
stay synchronized with later successful state updates.

```ts
import { Effect, Schema } from "effect"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"

const preferences = Effect.fn("preferences")(function* () {
  const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" })
  const density = yield* RefSubject.hydrate(Schema.String, "comfortable")
  const state = RefSubject.hydrateAll(page, density)

  return html`<section ref=${state} data-density=${density}>
    <p>Page ${page}</p>
  </section>`
})
```

Each member retains its own value type, typed failures, and codec-service requirements. Combining
two refs with the same named hydration attribute fails immediately, because there would be no
unambiguous DOM owner. Keep `hydrateAll` at the Template boundary; it does not make unrelated
RefSubjects one shared state model.

For the full DOM adoption contract, read [Hydrating Typed HTML](/explore/hydrating-typed-html). For
element references that acquire browser resources, read [Template references and element access](/explore/template-references-and-element-access).
