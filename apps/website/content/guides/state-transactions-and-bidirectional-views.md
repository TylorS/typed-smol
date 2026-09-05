---
title: "State transactions and bidirectional views"
summary: "Make one serialized change, return a useful result, or expose a writable lens without copying state."
section: "State"
kind: "guide"
order: 2.25
---

`RefSubject.update` is enough for most named transitions. Use the APIs here when a transition must
return a result, several reads and writes must share one transaction, a consumer needs a writable
representation in another type, or an observer needs a bounded view of pushed versions.

The transition operations return Effects; `transform` and `slice` return RefSubject views. The
[Effect type guide](https://www.effect.website/docs/v4/getting-started/the-effect-type/) explains
an Effect's value, expected-error, and service channels. The examples run in a Scope so temporary
state is finalized when each program completes.

## Commit a change and return a separate result

`modify` takes one pure function that returns `[result, nextState]`. The result is for the caller;
the second element is the only value committed. `modifyEffect` is the version for a transition that
can fail or needs a service. Both run in the RefSubject's serialized update boundary, so callers do
not need to coordinate a read and a later write themselves.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

type Reservation =
  | { readonly accepted: false }
  | { readonly accepted: true; readonly seat: number };

const program = Effect.scoped(
  Effect.gen(function* () {
    const remainingSeats = yield* RefSubject.make(2);
    const reservation = yield* RefSubject.modify(remainingSeats, (current): readonly [Reservation, number] =>
      current === 0
        ? ([{ accepted: false }, current] as const)
        : ([{ accepted: true, seat: current }, current - 1] as const),
    );

    return { reservation, remaining: yield* remainingSeats };
  }),
);

await Effect.runPromise(program);
```

The returned reservation and committed remaining-seat count come from one serialized transition;
the decision cannot become stale between the read and the write.

## Use an explicit transaction when a transition has multiple steps

`runUpdates` gives a callback a `GetSetDelete<A, E, R>` for one serialized transaction. Read with
`get`, make zero or more buffered writes with `set`, and return the domain result. `onInterrupt` is
available when an interrupted transaction needs an explicit compensation or record; choose whether
that callback receives the initial or current transaction value.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const reserve = <E, R>(remainingSeats: RefSubject.RefSubject<number, E, R>) =>
  RefSubject.runUpdates(
    remainingSeats,
    Effect.fn("reserve")(function* (seats) {
      const current = yield* seats.get;
      if (current === 0) return { accepted: false };

      yield* seats.set(current - 1);
      return { accepted: true, seat: current };
    }),
    {
      value: "initial",
      onInterrupt: (initial) => Effect.log(`reservation interrupted with ${initial} seats`),
    },
  );

const program = Effect.scoped(
  Effect.gen(function* () {
    const remainingSeats = yield* RefSubject.make(1);
    return yield* reserve(remainingSeats);
  }),
);

await Effect.runPromise(program);
```

Keep the transaction callback behind a named operation such as `reserve`. That preserves the domain
language for tests, event handlers, routes, and other consumers.

## Expose another writable representation without another store

`transform` creates a bidirectional view. The first function maps source values out; the second maps
writes back to the source. It is useful for a boundary that truly has two representations, such as a
number in the model and a string at an input boundary. It is not validation by itself: decide what
to do with invalid strings before exposing a lossy reverse mapping.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const quantity = yield* RefSubject.make(2);
    const quantityText = RefSubject.transform(
      quantity,
      (value) => value.toString(),
      (text) => Number(text),
    );

    yield* RefSubject.set(quantityText, "7");
    return yield* quantity;
  }),
);

await Effect.runPromise(program); // 7
```

The transformed ref delegates its lifetime, errors, subscriptions, and serialized update boundary
to the original. Unlike `map`, it remains writable; `map` returns a read-only `Computed`.

## Bound an observation, not the state

`slice(ref, skip, take)` returns another writable RefSubject facade, but it changes only its Fx
observation channel. Current reads and writes still delegate to the original state. This is useful
for a test or a one-shot observer that needs exactly a bounded number of pushed versions; it is not
a way to truncate a state history or limit future writes.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const count = yield* RefSubject.make(0);
    const firstUpdate = RefSubject.slice(count, 1, 1);

    yield* RefSubject.set(count, 1);
    yield* RefSubject.set(count, 2);

    return yield* firstUpdate;
  }),
);

await Effect.runPromise(program);
```

`slice` preserves ordinary current reads. To test the bounded pushed sequence, observe it in a
Scope as shown in [Testing Typed systems](/explore/testing-typed-systems). For state combinations
that become read-only when any input is read-only, see
[Composing RefSubject state](/explore/composing-refsubject-state).
