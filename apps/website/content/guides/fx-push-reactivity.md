---
title: Fx: work arrives
summary: Build and run producer-driven work with Effect values, errors, services, and cleanup.
section: Fx
kind: concept
order: 1
---

`Fx` represents work that can produce zero, one, or many values over time. Use it when the source
of work decides when the next value exists: a finite batch, an Effect result, a timer, a browser
event, or a subscription. The same Fx can be transformed, composed, observed, and tested without
changing the process that produces its values.

An `Fx<A, E, R>` says what values can arrive (`A`), which expected errors can happen (`E`), and
which services are required to run it (`R`). Creating one is lazy. A runner such as `Fx.observe` or
`Fx.collectAll` starts the work.

## Learn Fx as an operator vocabulary

Learn Fx in the order its decisions arise: construct a source, transform it, carry local state,
flatten or combine work, select a window, model time, handle failure, share resources, then run it.

Fx adds Effect's channels and lifetime model at the exact point each operator needs them:

| Chapter | Decision | Effect-specific behavior |
| --- | --- | --- |
| [Building Fx values](/explore/building-fx) | What produces values? | Effects, Streams, typed failures, services, and cleanup cross the source boundary intact. |
| [Transforming Fx](/explore/transforming-fx) | What does each value mean? | Effectful callbacks add their errors and requirements instead of hiding them. |
| [Stateful transforms](/explore/fx-stateful-transforms) | What history belongs to one run? | Accumulators and buffers are recreated for every subscription. |
| [Flattening work](/explore/fx-higher-order-and-concurrency) | What happens when one value starts more work? | Fibers, Scope, interruption, ordering, and concurrency become explicit policy. |
| [Composing Fx](/explore/composing-fx) | How do independent producers relate? | Their value, error, and service channels compose together. |
| [Selection and cardinality](/explore/fx-selection-and-cardinality) | Which values and boundaries remain? | Effectful predicates retain typed failure and service requirements. |
| [Time and rate](/explore/fx-time-and-rate) | When may a value arrive? | Schedule, Clock, TestClock, and interruption replace unmanaged timers. |
| [Errors and recovery](/explore/fx-errors-and-recovery) | Which ending can be recovered? | Typed errors remain distinct from defects and interruption in `Cause`. |
| [Services and lifetime](/explore/fx-services-and-lifetime) | Who owns a live subscription? | Layers provide requirements; Scope and Fiber define shutdown. |
| [Consuming Fx](/explore/consuming-fx) | What does the application need from the producer? | Runners return Effects or Fibers instead of starting hidden global work. |

These chapters curate the decisions people make repeatedly. The [API reference](/reference/modules/%40typed%2Ffx)
remains the exhaustive surface.

## Start with a source and a small transformation

A finite source is a useful first Fx: it has a clear end, so `collectAll` can turn its produced
values back into one Effect result. The source still owns when values are offered to the pipeline;
the consumer does not read an array one item at a time.

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

const shortcuts = Fx.fromIterable(["open-search", "", "open-settings"]).pipe(
  Fx.filter((command) => command.length > 0),
  Fx.map((command) => ({ type: "shortcut", command }) as const),
)

const program: Effect.Effect<ReadonlyArray<{ readonly type: "shortcut"; readonly command: string }>> =
  Fx.collectAll(shortcuts)

const values = await Effect.runPromise(program)
// [{ type: "shortcut", command: "open-search" }, { type: "shortcut", command: "open-settings" }]
```

This small pipeline has the shape of an Fx program: choose a source, transform what it produces,
then decide how to consume the result. [Transforming Fx](/explore/transforming-fx) develops that
transformation vocabulary. When each value starts another Fx, [Composing Fx](/explore/composing-fx)
explains the available concurrency and cancellation policies.

## Lift an Effect without losing its boundary

`Fx.fromEffect` turns one Effect result into one Fx emission. Its expected errors and service
requirements remain visible when you observe it.

```ts
import { Context, Data, Effect, Layer } from "effect"
import { Fx } from "@typed/fx"

class SearchUnavailable extends Data.TaggedError("SearchUnavailable")<{
  readonly query: string
}> {}

class WorkspaceSearch extends Context.Service<WorkspaceSearch, {
  readonly first: (query: string) => Effect.Effect<string, SearchUnavailable>
}>()("example/WorkspaceSearch") {}

const firstResult = Fx.fromEffect(
  Effect.gen(function* () {
    const search = yield* WorkspaceSearch
    return yield* search.first("effect")
  }),
)

const reported: Effect.Effect<unknown, SearchUnavailable, WorkspaceSearch> = Fx.observe(
  firstResult,
  (result) => Effect.log(`first result: ${result}`),
)

const WorkspaceSearchLive = Layer.succeed(WorkspaceSearch, {
  first: () => Effect.succeed("Effect documentation"),
})

const program = reported.pipe(Effect.provide(WorkspaceSearchLive))
```

Before `WorkspaceSearchLive` is provided, `reported` needs `WorkspaceSearch`; it can fail with
`SearchUnavailable`. The Layer supplies the service, but it does not hide the expected error. At the
application boundary, choose whether to recover, report the error, or return it to the caller.

`fromEffect` is for one eventual result. Use `RefSubject` for current writable state and a live Fx
source when future values can continue to arrive. [Building Fx values](/explore/building-fx) explains
the available source constructors; [Fx errors and recovery](/explore/fx-errors-and-recovery) goes
deeper on expected failures.

## Adapt callbacks at the edge

Use `Fx.callback` only when a foreign API calls your code. Return cleanup for the foreign resource;
the subscription's Scope runs it when the source completes or is interrupted.

```ts
import { Effect } from "effect"
import { expect, it } from "vitest"
import { Fx } from "@typed/fx"

it("cleans up a callback subscription", async () => {
  let removals = 0

  const source = Fx.callback<string>((emit) => {
    queueMicrotask(() => {
      emit.succeed("ready")
    })

    return Effect.sync(() => {
      removals += 1
    })
  })

  await Effect.runPromise(Fx.collectAll(source.pipe(Fx.take(1))))
  expect(removals).toBe(1)
})
```

`emit.succeed` starts sink delivery immediately and returns its running Fiber. `Fx.take(1)` owns
completion here, so the adapter does not race a separate `emit.done()` Fiber against value delivery.

For a shared, long-lived subscription, let an application Layer own its lifetime. A finite program
may close its own Scope after the consumer finishes; live work needs an owner that stays open for as
long as the subscription should run. [Fx services and lifetime](/explore/fx-services-and-lifetime)
and [Consuming Fx](/explore/consuming-fx) cover those ownership choices.
