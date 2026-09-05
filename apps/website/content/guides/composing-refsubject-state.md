---
title: "Composing RefSubject state"
summary: "Combine writable state, read-only projections, conditional views, services, and external sources without copying values between stores."
section: "State"
kind: "guide"
order: 2.1
---

`RefSubject` has three related state shapes:

| Shape | Current read | Pushed updates | Write access |
| --- | --- | --- | --- |
| `RefSubject<A, E, R>` | `Effect<A, E, R>` | `Fx<A, E, R>` | yes |
| `Computed<A, E, R>` | `Effect<A, E, R>` | `Fx<A, E, R>` | no |
| `Filtered<A, E, R>` | `Effect<A, E | NoSuchElementError, R>` | emits only present values | no |

The distinction prevents accidental ownership. A model exposes a writable `RefSubject`; consumers
receive a `Computed` or `Filtered` whenever they do not own transitions.

## Derive values without mirroring state

`map` and `mapEffect` project one source. `filterMap` produces a `Filtered` view when a current value
may be absent. `compact` does the same for an `Option`. None of them allocates a second mutable store:
the derived value samples and observes the original source.

```ts
import { Effect, Option } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.gen(function* () {
  const query = yield* RefSubject.make("");
  const normalized = RefSubject.map(query, (value) => value.trim().toLowerCase());
  const submitted = RefSubject.filterMap(normalized, (value) =>
    value.length === 0 ? Option.none() : Option.some(value),
  );

  yield* RefSubject.set(query, "  Typed  ");
  return yield* submitted;
}).pipe(Effect.scoped);
```

The current read of `submitted` can fail while the query is empty because absence is meaningful.
Its Fx side simply waits until a present value is committed. That is different from inventing an
empty string, `undefined`, or another sentinel.

## Combine refs and preserve the weakest capability

`struct` and `tuple` combine current reads and pushed updates. Their result is writable only when
every input is writable. Adding a `Computed` makes the combined value computed; adding a `Filtered`
makes it filtered. Errors and services are unions of the inputs.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const program = Effect.gen(function* () {
  const first = yield* RefSubject.make("Ada");
  const last = yield* RefSubject.make("Lovelace");
  const full = RefSubject.map(RefSubject.tuple([first, last]), ([a, b]) => `${a} ${b}`);
  const profile = RefSubject.struct({ first, last, full });

  yield* RefSubject.set(first, "Augusta");
  return yield* profile;
}).pipe(Effect.scoped);
```

`profile` is read-only because `full` is read-only. The writable inputs remain independently
available to the model that owns them.

## Project object fields lazily

`proxy(source)` turns each accessed object or tuple property into a memoized `Computed` or
`Filtered`. It caches projection objects, not values. Use it when several consumers need individual
fields but the model should still commit one coherent object.

Use `RefStruct` or `RefTuple` instead when callers also need typed field/index transitions. Those
specialized modules are covered in [Choosing specialized RefSubject modules](/explore/specialized-refsubject-state).

## Adapt a source once

`fromEffect`, `fromFx`, and `fromStream` create current state from Effect ecosystem producers.
`fromOption` and `fromNullable` store optional values in writable state; apply `compact` when a
consumer needs a `Filtered` view of present values.
Creation requires `Scope`; that Scope owns the live source subscription and interruption.

Do not subscribe to a source and manually copy every value into another ref. Use the constructor
whose source contract is already true. The source's errors remain visible on current reads and pushed updates. Source services are
required and captured when constructing the ref; later reads do not require those services again.
See [sources and lifetime](/explore/refsubject-sources-equality-and-lifetime) for initialization timing.

## Put shared state in Context

`RefSubject.Service` defines a service whose implementation is the ref itself. `Service.make(initial)`
builds a Layer, while `computedFromService` and `filteredFromService` expose read-only service-backed
views. Use that boundary for application state shared across routes, workers, commands, and UI.

Keep local state local. A ref created inside an already-scoped operation does not become better by
being put in global Context. The service boundary is useful when multiple independently constructed
consumers need the same state and lifetime.

## Choose the operation that states the transition

- `set` replaces the committed value.
- `reset` returns to the initializer's current value.
- `update` and `updateEffect` compute the next value atomically.
- `modify` and `modifyEffect` commit state and return a separate result.
- `runUpdates` runs a callback inside one serialized transaction.

All writes are serialized. If a domain already has a named operation—`toggle`, `append`, `setSome`,
`addEdge`—prefer the specialized module's operation because it communicates the invariant directly.

