# @typed/fx

> **Beta:** This package is in beta; APIs may change.

`@typed/fx` provides reactive streams and state for Effect: **Fx** (streams with rich combinators and run functions), **Push**, **RefSubject** (and typed refs like RefArray, RefBoolean), **Subject**, **Sink**, and **Versioned**. Use it for event streams, reactive UI state, and composing effects as streams.

## Dependencies

- `effect`

## API overview

- **Fx** — Stream type `Fx.Fx<A, E, R>` with constructors (`succeed`, `fail`, `fromEffect`, `fromIterable`, `make`, `periodic`, etc.), combinators (`map`, `flatMap`, `filter`, `take`, `switchMap`, etc.), and run (`runPromise`, `collect`, `fork`, `observe`).
- **Push** — Push-based stream abstraction.
- **RefSubject** — Mutable reactive refs; `RefSubject.make(initial)`; typed helpers like `RefSubject.increment` / `RefSubject.decrement` for numbers; `RefArray`, `RefBoolean`, `RefOption`, etc.
- **Subject** — Multicast subject for Fx streams.
- **Sink** — Consumer abstraction with combinators.
- **Versioned** — Versioned values.

## Example

```ts
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);
  return html`<div>
    <button onclick=${RefSubject.increment(count)}>Increment</button>
    <button onclick=${RefSubject.decrement(count)}>Decrement</button>
    <p>Count: ${count}</p>
  </div>`;
});

yield* render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
);
```

See the [counter example](https://github.com/typed-smol/typed-smol/tree/main/examples/counter) for a full runnable app.
