---
title: Transforming Fx
summary: Turn pushed values into useful domain data without hiding failures, services, or timing.
section: Fx
kind: guide
order: 1.2
---

Suppose a product feed pushes every catalog change, but the page only needs active products with a
display price. The source already decides when each update arrives. Transformation decides what
each update means.

```ts
import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";

interface Product {
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
  readonly active: boolean;
}

const products = Fx.fromIterable<Product>([
  { id: "desk", name: "Standing desk", priceInCents: 49900, active: true },
  { id: "lamp", name: "Desk lamp", priceInCents: 8900, active: false },
]);

const cards = products.pipe(
  Fx.filterMap((product) => (product.active ? Option.some(product) : Option.none())),
  Fx.map(({ id, name, priceInCents }) => ({
    id,
    title: name,
    price: `$${(priceInCents / 100).toFixed(2)}`,
  })),
);

const result = await Effect.runPromise(Fx.collectAll(cards));
// [{ id: "desk", title: "Standing desk", price: "$499.00" }]
```

`map` emits one output for every input, and `as` replaces each input with one constant output.
`filter` keeps or drops the original value. `filterMap` combines those decisions: `Option.some`
emits a transformed value and `Option.none` emits nothing. `mapBoth` keeps one-for-one successes
while also mapping typed failures. These synchronous, pure transforms preserve the source's order,
service requirements, and lifetime.

```fx-marble
title: map and as emit once for every input
covers: map, as
input: a . b . c |
operator: map(f) / as(value)
output: value . value . value |
```

```fx-marble
title: filter keeps admitted values in their input slots
covers: filter
input: 1 2 3 4 |
operator: filter(isEven)
output: . 2 . 4 |
```

```fx-marble
title: filterMap omits None and emits each Some in order
covers: filterMap
input: 1 2 3 4 |
operator: filterMap(toOption)
output: . 20 . 40 |
```

`compact` is the Option-shaped version of the same omission rule: it drops `None` and unwraps
`Some`, without changing the slots of retained values.

```fx-marble
title: compact drops None and unwraps Some
covers: compact
input: Some(a) None Some(b) |
operator: compact
output: a . b |
```

```fx-marble
title: mapBoth keeps one success output while also mapping typed failures
covers: mapBoth
input: ok !offline
operator: mapBoth(success, failure)
output: OK !OfflineError
```

Use these operators when the answer is already in memory. Do not put a Promise, thrown parse error,
or service lookup inside `map`; those behaviors belong in Effect.

## Add Effect when transformation can fail or needs a service

Now the page must display prices in the shopper's currency. Looking up an exchange rate can fail and
depends on a service supplied by the application. `mapEffect` makes both facts part of the resulting
Fx type.

```ts
import { Context, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class MissingRate extends Data.TaggedError("MissingRate")<{
  readonly currency: string;
}> {}

class ExchangeRates extends Context.Service<
  ExchangeRates,
  {
    readonly fromUsd: (currency: string) => Effect.Effect<number, MissingRate>;
  }
>()("docs/ExchangeRates") {}

interface Price {
  readonly usd: number;
  readonly currency: string;
}

const prices = Fx.fromIterable<Price>([
  { usd: 499, currency: "EUR" },
  { usd: 89, currency: "GBP" },
]);

const convertPrice = Effect.fn("convertPrice")(function* (price: Price) {
  const rates = yield* ExchangeRates;
  const rate = yield* rates.fromUsd(price.currency);
  return price.usd * rate;
});

const converted: Fx.Fx<number, MissingRate, ExchangeRates> = prices.pipe(
  Fx.mapEffect(convertPrice),
);

const runnable = converted.pipe(
  Fx.provideService(ExchangeRates, {
    fromUsd: (currency) =>
      currency === "EUR"
        ? Effect.succeed(0.92)
        : currency === "GBP"
          ? Effect.succeed(0.79)
          : Effect.fail(new MissingRate({ currency })),
  }),
);

const result = await Effect.runPromise(Fx.collectAll(runnable));
// [459.08, 70.31]
```

The annotation exposes what TypeScript inferred: values are `number`, expected failures are
`MissingRate`, and running the unprovided Fx requires `ExchangeRates`. `provideService` removes that
requirement at this example's application boundary. A real application would usually provide a
Layer shared by the rest of its Effect program.

Choose the Effectful operator that matches the output:

- `mapEffect` runs one Effect and emits its successful value.
- `filterEffect` runs an Effectful predicate and keeps the original value when it returns `true`.
- `filterMapEffect` runs one Effect that may return `Option.none` instead of emitting.
- `tap` runs an Effect for logging, metrics, or another observation, then emits the original value.

The callback's failures and requirements join the source's `E` and `R` channels. Handle a known
error with `catchTag`, or translate it with `mapError`; do not catch defects or interruption as if
they were ordinary domain failures. Effect's guides to
[services](https://www.effect.website/docs/v4/requirements-management/services/) and
[expected errors](https://www.effect.website/docs/v4/error-management/expected-errors/) describe
the same channels used here.

An Effectful transform also preserves the producer's concurrency. If the source delivers values
concurrently, callback Effects may overlap and finish out of order. `mapEffect` does not silently
add a queue. Choose a serialized producer or an explicit higher-order concurrency policy when order
matters.

The simple timelines below assume sequential delivery; concurrent producers may complete Effectful
callbacks out of order as described above.

```fx-marble
title: mapEffect emits one successful result for each input
covers: mapEffect
input: 1 . 2 . 3 |
operator: mapEffect(loadLabel)
output: label-1 . label-2 . label-3 |
```

```fx-marble
title: filterEffect keeps values whose Effectful predicate succeeds
covers: filterEffect
input: 1 2 3 4 |
operator: filterEffect(isEven)
output: . 2 . 4 |
```

```fx-marble
title: filterMapEffect emits only successful Some results
covers: filterMapEffect
input: 1 2 3 4 |
operator: filterMapEffect(parse)
output: . 10 . 40 |
```

```fx-marble
title: tap observes each value before forwarding it
covers: tap
input: 1 . 2 . 3 |
operator: tap(record)
output: 1 . 2 . 3 |
```

## Add state or time only when the behavior needs it

A search box needs two behaviors that pure mapping cannot express: ignore the same normalized query
twice in a row, and wait until typing settles. `skipRepeats` retains one previous value for each run;
`debounce` owns one replaceable timer in the subscription's Scope.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const queries = Fx.fromIterable([" t", "ty", "typed", "typed "]).pipe(
  Fx.map((query) => query.trim()),
  Fx.filter((query) => query.length >= 2),
  Fx.skipRepeats,
  Fx.debounce("10 millis"),
);

const result = await Effect.runPromise(Effect.scoped(Fx.collectAll(queries)));
// ["typed"]
```

State and timing belong to one run. A second run gets a fresh previous value and a fresh timer;
interrupting the run cancels its pending timing work. Use `scan` when every accumulated state should
be emitted, `loop` when the emitted value differs from the next state, and `throttle` when the goal
is to bound frequency rather than wait for silence. Test time-dependent pipelines with Effect's
[TestClock](https://www.effect.website/docs/v4/testing/testclock/) instead of real sleeps.

The practical rule is small: begin with `map`, `filter`, or `filterMap`; move to an Effectful variant
when work can fail or needs services; add per-run state or timing only when it is observable product
behavior. Continue with [Composing Fx](/explore/composing-fx) when one value starts another Fx and
cancellation or concurrency becomes the decision. The [Fx API reference](/reference/packages/%40typed%2Ffx)
contains the complete signatures.
