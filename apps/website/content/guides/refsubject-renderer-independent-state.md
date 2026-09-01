---
title: RefSubject: state without a renderer
summary: Keep a current value and named transitions outside the UI that happens to show them.
section: State
kind: concept
order: 2
---
`RefSubject` is state you can build, derive, and test before anything renders. Put the model and
its named transitions in ordinary Effect code; a renderer is then just one consumer of that state.
That makes a failing state test about the model, not about a mounted tree.

The inverse is also useful: state does not have to be global or permanent. When a value should live
only as long as a component, create its `RefSubject` in that component's Scope. The component owns
the lifetime; the state logic remains independent enough to exercise without rendering it.

`RefSubject<A, E, R>` is both an `Effect<A, E, R>` for a current read and an `Fx<A, E, R>` for
changes over time. Yield it to read the value that has already committed; pass the same value to Fx
combinators when later commits matter. Write through its serialized update boundary. One contract
covers state code, tests, and rendering.

Creating a ref requires the Scope owned by the application or component that keeps it alive. Reading,
updating, and deriving an existing ref do not need a fresh Scope. Do not wrap a short state
transition in `Effect.scoped` merely to construct and immediately close its owner.

## Model the transition where the state lives

Here, selection is complete and testable without a template. `RefSubject.map` creates a read-only
`Computed` view, so the count stays derived from the selected IDs rather than becoming another piece
of writable state.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const select = <E, R>(selectedIds: RefSubject.RefSubject<ReadonlySet<string>, E, R>, id: string) =>
  RefSubject.update(selectedIds, (current) => new Set([...current, id]))

const makeSelectionModel = Effect.fn("makeSelectionModel")(function* () {
  const selectedIds = yield* RefSubject.make<ReadonlySet<string>>(new Set())
  const selectedCount = RefSubject.map(selectedIds, (ids) => ids.size)

  return {
    selectedIds,
    selectedCount,
    select: (id: string) => select(selectedIds, id),
  }
})

const inspectSelection = Effect.fn("inspectSelection")(function* () {
  const selection = yield* makeSelectionModel()

  yield* selection.select("invoice-42")
  yield* selection.select("invoice-42")

  return {
    ids: [...(yield* selection.selectedIds)],
    count: yield* selection.selectedCount,
  }
})
```

`set` replaces a value. `update` reads the committed value, derives the next one, and commits it.
For a multi-step change, `ref.updates` gives the callback transactional `get`, `set`, and `delete`
operations; that whole callback is atomic and serialized with other writes. Use these operations for
domain transitions such as `select`, `increment`, or `close`, not only at the event site that happens
to invoke them.

## Read now; observe changes when needed

The two capabilities are independently useful. The Effect view makes imperative decisions from the
current value. The Fx view builds a long-lived reaction to updates. Neither operation turns state
into UI.

```ts
import { Effect, Scope } from "effect"
import { Fx, RefSubject } from "@typed/fx"

const currentCount = (count: RefSubject.RefSubject<number>): Effect.Effect<number> => count

const countChanges = (count: RefSubject.RefSubject<number>): Fx.Fx<string, never, Scope.Scope> =>
  Fx.map(count, (value) => `count is ${value}`)

const changeCount = (count: RefSubject.RefSubject<number>) =>
  RefSubject.update(count, (value) => value + 1)

const decideFromCount = Effect.fn("decideFromCount")(function* (count: RefSubject.RefSubject<number>) {
  return (yield* currentCount(count)) === 0 ? "empty" : "non-empty"
})
```

`countChanges` is only a description of what to emit. A consumer such as `Fx.observe` decides when
to run it and owns that subscription's Scope. `currentCount` and `changeCount` work against the same
ref without starting an observer or adding another lifecycle.

`Computed` always has a value derived from its source. A `Filtered` view represents derived state
that may currently be absent. Both stay read-only, so writes remain visible at the source's named
transition boundary.

Source-backed refs are lazy in the same important sense as Effect: an `Effect`, `Stream`, or `Fx`
source does no work until the `RefSubject` creation Effect runs. What starts after construction, how
each source initializes, and how its lifetime ends are covered in
[State sources, equality, and lifetime](/explore/refsubject-sources-equality-and-lifetime).
