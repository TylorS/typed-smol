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

`RefSubject<A, E, R>` has a current value, typed expected errors, and typed service requirements.
Yield it in an Effect to read its current `A`; use it as an `Fx` to observe committed changes; write
through its serialized update boundary. One contract covers state code, tests, and rendering.

## Model the transition where the state lives

Here, selection is complete and testable without a template. `RefSubject.map` creates a read-only
`Computed` view, so the count stays derived from the selected IDs rather than becoming another piece
of writable state.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

const select = <E, R>(selectedIds: RefSubject.RefSubject<ReadonlySet<string>, E, R>, id: string) =>
  RefSubject.update(selectedIds, (current) => new Set([...current, id]));

const program = Effect.scoped(
  Effect.gen(function* () {
    const selectedIds = yield* RefSubject.make<ReadonlySet<string>>(new Set());
    const selectedCount = RefSubject.map(selectedIds, (ids) => ids.size);

    yield* select(selectedIds, "invoice-42");
    yield* select(selectedIds, "invoice-42");

    return {
      ids: [...(yield* selectedIds)],
      count: yield* selectedCount,
    };
  }),
);

await Effect.runPromise(program); // { ids: ["invoice-42"], count: 1 }
```

`set` replaces a value. `update` reads the committed value, derives the next one, and commits it.
For a multi-step change, `ref.updates` gives the callback transactional `get`, `set`, and `delete`
operations; that whole callback is atomic and serialized with other writes. Use these operations for
domain transitions such as `select`, `increment`, or `close`, not only at the event site that happens
to invoke them.

## Read now; observe changes when needed

The same ref is an Effect for its current value and an `Fx` for later commits. Observing is explicit:
it starts when the observing Effect runs and belongs to the Scope that runs it.

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";

const program = Effect.scoped(
  Effect.gen(function* () {
    const count = yield* RefSubject.make(0);

    yield* Effect.forkScoped(
      Fx.observe(count, (value) => Effect.log(`count is ${value}`)),
    );

    yield* RefSubject.update(count, (value) => value + 1);
    return yield* count;
  }),
);

await Effect.runPromise(program); // 1
```

`Computed` always has a value derived from its source. A `Filtered` view represents derived state
that may currently be absent. Both stay read-only, so writes remain visible at the source's named
transition boundary.

Source-backed refs are lazy in the same important sense as Effect: an `Effect`, `Stream`, or `Fx`
source does no work until the `RefSubject` creation Effect runs. What starts after construction, how
each source initializes, and how its lifetime ends are covered in
[State sources, equality, and lifetime](/explore/refsubject-sources-equality-and-lifetime).
