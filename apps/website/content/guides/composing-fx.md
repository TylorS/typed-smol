---
title: "Composing Fx"
summary: "Coordinate independent producers, then recognize when a value starts work of its own."
section: "Fx"
kind: "guide"
order: 1.5
---

Imagine a search screen. It receives saved searches and live updates, combines the current query
with the current filter, then starts a request for each usable search input. Those are two different
kinds of composition.

Independent producers describe facts that happen on their own schedules. Compose them by asking how
their *values* relate. When an outer value starts another Fx or an Effect, the relationship is about
the *work* it creates. Keep those decisions separate. [Transforming Fx](/explore/transforming-fx)
covers the one-to-one `map`, `filter`, and `mapEffect` work that changes an emitted value without
creating a producer.

## Let independent producers keep their own schedule

An activity feed can receive a local event and a server event at the same time. Both matter, so
`merge` subscribes to both and forwards each value when it arrives. Each producer keeps its own
order; there is deliberately no order between producers.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const local = Fx.at("saved locally", "5 millis");
const server = Fx.at("saved on the server", "1 millis");

const activity = Fx.merge(local, server);
const messages = await Effect.runPromise(Fx.collectAll(activity));
// ["saved on the server", "saved locally"]
```

Use `merge` for independent events where every value deserves delivery. Completion waits for both
producers, and interrupting the consumer interrupts both.

```fx-marble
title: merge preserves the timing of independent producers
covers: merge, mergeAll, mergeLeft, mergeRight
input local: local-1 . . local-2 . |
input server: . server-1 . . server-2 |
operator: merge / mergeAll / mergeLeft / mergeRight
output merge: local-1 server-1 . local-2 server-2 |
output mergeLeft: local-1 . . local-2 . |
output mergeRight: . server-1 . . server-2 |
```

`mergeAll` has the same rule for a known set of lanes. `mergeLeft` and `mergeRight` still run both
lanes and wait for both to finish, but expose only the named side; the three output rows make that
value choice explicit.

Sometimes one producer is the beginning of a story rather than a peer. A cached snapshot should be
shown before a live subscription begins. `concat` and `continueWith` run the continuation only after
the first producer returns.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const cached = Fx.fromIterable(["cached: Ada", "cached: Lin"]);
const live = Fx.fromIterable(["live: Grace"]);

const people = Fx.concat(cached, live);
const values = await Effect.runPromise(Fx.collectAll(people));
// ["cached: Ada", "cached: Lin", "live: Grace"]
```

That sequencing is observable: an infinite first producer means the second producer never starts.

```fx-marble
title: concat and continueWith start the next lane after the first ends
covers: concat, continueWith
input cached: cached . | . .
input live: . . ^ live |
operator: concat / continueWith
output: cached . . live |
```

`append`, `prepend`, and `delimit` are the small framing forms of that sequencing: they put a
constant before, after, or on both sides of one producer.

```fx-marble
title: append, prepend, and delimit frame one producer
covers: append, prepend, delimit
input values: . value-1 value-2 | .
operator: append / prepend / delimit
output append: . value-1 value-2 end |
output prepend: start value-1 value-2 | .
output delimit: start value-1 value-2 end |
```

## Combine independent values into the current state

A query and a filter are separate producers, but a search request needs both. `zipLatest` waits for
an initial value from each, then emits the latest pair whenever either changes. It describes a
current state, not a one-for-one pairing.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const queries = Fx.fromIterable(["effect", "effect v4"]);
const filters = Fx.fromIterable(["guides", "api"]);

const searchInput = Fx.zipLatest(queries, filters);
const states = await Effect.runPromise(Fx.collectAll(searchInput));
```

Use `zip` when the first value must meet the first value, then the second with the second. Use
`zipLatest` when either input may revise the same view.

```fx-marble
title: zipLatest emits after both inputs have a current value
covers: tuple, struct, zipLatest, zipLatestWith
input query: effect . effect-v4 . . |
input filter: . guides . . api |
operator: tuple / struct / zipLatest / zipLatestWith
output tuple / zipLatest: . E+G V4+G . V4+API |
output struct: . query:E+filter:G query:V4+filter:G . query:V4+filter:API |
output zipLatestWith: . search(E,G) search(V4,G) . search(V4,API) |
```

The output labels abbreviate the current query and filter pair: `E+G` is `effect` with `guides`,
and `V4+API` is `effect-v4` with `api`. `tuple` keeps positions; `struct` gives them names;
`zipLatestWith` projects the pair. Each waits for every lane once, then emits when any lane changes.

## Choose which lane is allowed to trigger

`withLatestFrom` treats the left lane as the event and the right lane as supporting state. A left
value before the first right value is dropped, and right changes do not emit by themselves.

```fx-marble
title: withLatestFrom emits only when its source changes after state is ready
covers: withLatestFrom, withLatestFromWith
input source: source-1 . source-2 . |
input state: . ready . revised |
operator: withLatestFrom / withLatestFromWith
output withLatestFrom: . . source-2+ready . |
output withLatestFromWith: . . label(source-2,ready) . |
```

`sample` reverses that ownership: it retains source values and emits the newest one only when the
sampler ticks. Source completion ends the result and cancels the sampler.

```fx-marble
title: sample reads the latest source value on each sampler tick
covers: sample
input values: value-1 . value-2 . |
input sampler: . tick . tick x
operator: sample(values, sampler)
output: . value-1 . value-2 |
```

Use `zip` for positional pairing instead. It waits for the next value from each lane, then the first
completion ends pairing and discards anything unmatched. The projection variants keep the same clock
but choose a different output.

```fx-marble
title: zip variants pair each next value and finish with the first completed lane
covers: zip, zipWith, zipLeft, zipRight
input left: left-1 . left-2 . |
input right: . right-1 . right-2 |
operator: zip / zipWith / zipLeft / zipRight
output zip: . L1+R1 . L2+R2 |
output zipWith: . pair(L1,R1) . pair(L2,R2) |
output zipLeft: . left-1 . left-2 |
output zipRight: . right-1 . right-2 |
```

`mergeOrdered` starts every lane now but withholds later values until earlier lanes finish.

```fx-marble
title: mergeOrdered buffers a faster later lane behind an earlier lane
covers: mergeOrdered
input first: . first . | .
input second: second . . . |
operator: mergeOrdered(first, second)
output: . first . second |
```

## Notice when a value starts work

Turning each complete search input into a request is no longer composition of independent producers.
Each outer value creates an Effect, so the next question is what a newer value does to work already
running. Here, only the newest query matters: `switchMapEffect` interrupts the old request before
starting its replacement.

```ts
import { Context, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class SearchFailed extends Data.TaggedError("SearchFailed")<{
  readonly query: string;
}> {}

interface SearchClient {
  readonly search: (query: string) => Effect.Effect<ReadonlyArray<string>, SearchFailed>;
}

const SearchClient = Context.Service<SearchClient>("docs/SearchClient");

const queries = Fx.mergeAll(Fx.at("effect", "0 millis"), Fx.at("effect v4", "5 millis"));
const results = queries.pipe(
  Fx.switchMapEffect((query) => Effect.flatMap(SearchClient, ({ search }) => search(query))),
);

const program = results.pipe(
  Fx.provideService(SearchClient, {
    search: (query) => Effect.as(Effect.sleep("20 millis"), [`result: ${query}`]),
  }),
  Fx.collectAll,
  Effect.scoped,
);

const values = await Effect.runPromise(program);
// [["result: effect v4"]]
```

`SearchFailed` remains in the Fx error channel and `SearchClient` remains a requirement until the
application provides it. `Effect.scoped` owns the active request and runs its finalizers when the
consumer finishes or is interrupted.

This is higher-order work. The choice between admitting every inner job, limiting it with
`flatMapConcurrently`, sequencing it with `concatMap`, replacing it with `switchMap`, ignoring it
with `exhaustMap`, or retaining the newest wait with `exhaustLatestMap` is a product rule. See
[Flatten work with an explicit policy](/explore/fx-higher-order-and-concurrency) for those policies.
