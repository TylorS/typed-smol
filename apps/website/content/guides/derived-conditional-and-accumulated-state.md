---
title: Derived, conditional, and accumulated state
summary: Build read-only views that keep current reads, pushed changes, absence, errors, and services explicit.
section: State
kind: guide
order: 2.15
---

`RefSubject` is the writable boundary. `Computed` and `Filtered` are read-only views over a
`Versioned` source: they combine an Effectful current read with an Fx of later values, but do not
add another place for callers to write.

| View | Current read | Fx observation | Writes |
| --- | --- | --- | --- |
| `Computed<A, E, R>` | `Effect<A, E, R>` | emits every derived value | no |
| `Filtered<A, E, R>` | `Effect<A, E \| NoSuchElementError, R>` | emits only present derived values | no |

Use a `Computed` for a value that always exists, such as a total or a validity flag. Use a
`Filtered` when absence is meaningful, such as a selected row that has not been chosen yet. Both
views keep the source's typed failures and service requirements visible.

## Computed is a lazy read-only projection

`map` is the pure projection; `mapEffect` is the Effectful form. `makeComputed` is the lower-level
constructor for any public `Versioned` source. The projection is not run when the view is created:
it runs when a current read or an Fx observation needs a value. The same projection applies to the
current channel and to pushed versions, so a read and an observer cannot silently use different
logic.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const cart = yield* RefSubject.make({ items: 2, unitPrice: 15 });
    const total = RefSubject.map(cart, ({ items, unitPrice }) => items * unitPrice);

    yield* RefSubject.set(cart, { items: 3, unitPrice: 15 });
    return yield* total;
  }),
);

await Effect.runPromise(program); // 45
```

There is no `set(total, ...)`: change `cart`, the state owner, and read or observe `total`. An
Effectful projection can add its own errors and services; those channels are part of the resulting
`Computed` rather than being swallowed. `Computed` itself performs no acquisition and retains no
independent value. An observation's Scope owns its subscription and its cleanup.

For object or tuple fields, `RefSubject.proxy` lazily creates and memoizes one derived view per
accessed property. It caches the view object, not a copied field value. A `Computed` source yields
`Computed` properties; a `Filtered` source yields `Filtered` properties and preserves absence.

## Filtered keeps absence in the type

`filterMap` and `filterMapEffect` return a `Filtered`; `compact` turns a `Computed<Option<A>>` (or
an Option-valued `Filtered`) into one. `Some(value)` becomes a pushed value. `None` is not a
sentinel and is not emitted by the Fx side. A current Effect read while absent fails with
`NoSuchElementError`.

```ts
import { Effect, Option } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const query = yield* RefSubject.make("   ");
    const submitted = RefSubject.filterMap(query, (value) => {
      const normalized = value.trim();
      return normalized.length === 0 ? Option.none() : Option.some(normalized);
    });

    const beforeSubmit = RefSubject.getOrElse(submitted, () => "(nothing submitted)");
    const fallback = yield* beforeSubmit;
    yield* RefSubject.set(query, "  typed  ");

    return {
      current: yield* submitted,
      fallback,
    };
  }),
);

await Effect.runPromise(program); // { current: "typed", fallback: "(nothing submitted)" }
```

`Filtered.asComputed()` is the explicit escape hatch when the consumer wants
`Computed<Option<A>>` and will handle `Some`/`None` itself. `getOrElse` instead makes a
`Computed<A>` whose pure fallback removes only the absence failure. This differs from
`RefSubject.fromOption` or `fromNullable`: those constructors store an `Option` in writable state;
they do not create `Filtered` state until `compact` is applied.

## Reads, observations, and lifetimes are separate tests

A current read samples the source when the Effect runs. An Fx observation starts with the current
retained value when it is present, then follows later committed versions; it owns its subscription
in the observing Scope. `Fx.observe` is useful for a long-lived consumer; `Fx.collectUpTo` is a
bounded test for an open source. Keep the two claims separate so a passing snapshot test does not
accidentally prove reactivity.

```ts
import { Effect, Fiber, Option } from "effect";
import { expect, it } from "vitest";
import { Fx, RefSubject } from "@typed/fx";

it("tests a derived current read without a renderer", () =>
  Effect.scoped(
    Effect.gen(function* () {
      const source = yield* RefSubject.make(2);
      const doubled = RefSubject.map(source, (value) => value * 2);

      expect(yield* doubled).toBe(4);
      yield* RefSubject.set(source, 5);
      expect(yield* doubled).toBe(10);
    }),
  ).pipe(Effect.runPromise),
);

it("tests present Filtered observations without a renderer", () =>
  Effect.scoped(
    Effect.gen(function* () {
      const source = yield* RefSubject.make<Option.Option<number>>(Option.none());
      const present = RefSubject.compact(source);

      const observed = yield* Effect.forkScoped(Fx.collectUpTo(present, 2));
      while ((yield* source.subscriberCount) < 1) yield* Effect.yieldNow;
      yield* RefSubject.set(source, Option.some(3));
      yield* RefSubject.set(source, Option.none());
      yield* RefSubject.set(source, Option.some(5));

      expect(yield* Fiber.join(observed)).toEqual([3, 5]);
    }),
  ).pipe(Effect.runPromise),
);
```

The second test demonstrates the asymmetry directly: `None` changes the source but contributes no
value to the `Filtered` Fx. In a test that observes with a callback, fork `Fx.observe` in
`Effect.forkScoped`, wait for the source's `subscriberCount`, then perform the writes. A fixed
sleep is not a synchronization contract.

## Errors, services, and interruption stay typed

`mapEffect` adds the projection's `E2` and `R2` to the source's channels. A source failure remains a
source failure; a projection failure remains a projection failure. `Filtered` additionally adds
`NoSuchElementError` only to its current-read Effect. Its Fx does not fail merely because a value is
absent—it skips that version. `makeComputed` and `makeFiltered` apply this same rule to an arbitrary
`Versioned` source.

```ts
import { Context, Effect } from "effect";
import { RefSubject } from "@typed/fx";

class Currency extends Context.Service<Currency, string>()("docs/Currency") {}

const formatCurrency = Effect.fn("formatCurrency")(function* (value: number) {
  const currency = yield* Currency;
  return `${currency} ${(value / 100).toFixed(2)}`;
});

const program = Effect.scoped(
  Effect.gen(function* () {
    const cents = yield* RefSubject.make(1250);
    const formatted = RefSubject.mapEffect(cents, formatCurrency);

    return yield* formatted;
  }),
).pipe(Effect.provideService(Currency, "USD"));

await Effect.runPromise(program); // "USD 12.50"
```

The callback in this example is still lazy: creating `formatted` does not look up `Currency`.
Provide services at the boundary that runs the read or observation. For a service that supplies a
whole `Computed` or `Filtered`, `computedFromService` and `filteredFromService` defer retrieving
that view from Context and preserve its behavior. Closing the owner Scope interrupts active work
and finalizes observations; `Computed` and `Filtered` do not invent a second lifetime.

## Accumulate only when history is the value

`scan` and `scanEffect` produce an accumulated `Computed` from a `RefSubject` or `Computed` source.
The accumulator is derived state, not a second writable store:

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const deltas = yield* RefSubject.make(1);
    const total = RefSubject.scan(deltas, 0, (sum, delta) => sum + delta);
    const label = RefSubject.scanEffect(deltas, "total: 0", (previous, delta) =>
      Effect.succeed(`${previous} + ${delta}`),
    );

    const initialTotal = yield* total;
    const initialLabel = yield* label;
    yield* RefSubject.set(deltas, 2);
    return {
      initialTotal,
      total: yield* total,
      initialLabel,
      label: yield* label,
    };
  }),
);

await Effect.runPromise(program);
```

There are two deliberate accumulation boundaries. On the Fx side, a subscription emits the
`initial` seed and then folds each source version. On the current-read side, one private accumulator
is shared by repeated reads of that `scan` value; each read folds the source value sampled at that
moment and advances only after a successful fold. Reading twice without a source update therefore
folds the same current value twice. Separate `scan` calls have separate read accumulators; a
subscription and current reads should not be mixed when they must share one exact history.
`scanEffect` leaves the read accumulator unchanged when its fold fails, while the failure remains
visible in the returned typed view.

Use a real writable `RefSubject` when a history must be independently edited, reset, or shared as
domain state. Use `scan` when the history is a useful query over another owner's transitions.
