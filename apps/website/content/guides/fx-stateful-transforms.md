---
title: Derive transitions and bounded batches
summary: Carry only the local history a transform needs, then expose transitions, changes, and groups explicitly.
section: Fx
kind: guide
order: 1.3
---

Imagine reconciling one shipment import. It delivers adjustments over time, and the import needs a
running balance, a readable event label, a record of meaningful status changes, and write batches.
Each transform keeps only the history for that one run. Run the same Fx again and its accumulator,
previous value, and batch buffer all start fresh; none of them becomes application state.

## Keep the accumulator that answers the question

`Fx.scan` exposes the accumulated value itself. It emits the initial value before the first
adjustment, then one next balance for each adjustment. That makes it the right shape when each
intermediate balance is useful.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const balances = Fx.fromIterable([12, -4, 7]).pipe(
  Fx.scan(100, (balance, adjustment) => balance + adjustment),
);

const values = await Effect.runPromise(Fx.collectAll(balances));
// [100, 112, 108, 115]
```

```fx-marble
title: scan emits its seed and every accumulated value
covers: scan
input: . 12 . -4 . 7 |
operator: scan(100, add)
output: 100 112 . 108 . 115 |
```

`Fx.scanEffect` runs the reducer as an Effect. Its result appears when that Effect resolves; this
one-turn reducer keeps the timing distinction visible.

```fx-marble
title: scanEffect emits each accumulated value when its reducer Effect resolves
covers: scanEffect
input: . 12 . -4 . 7 . |
operator: scanEffect(100, oneTurnAdd)
output: 100 . 112 . 108 . 115 |
```

Use `Fx.loop` when the next output is not the accumulator. It still carries state from one event to
the next, but its callback returns `[output, nextState]`, so it emits exactly once per input.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const labels = Fx.fromIterable(["received", "packed", "shipped"]).pipe(
  Fx.loop(1, (position, event) => [`${position}. ${event}`, position + 1] as const),
);

const values = await Effect.runPromise(Fx.collectAll(labels));
// ["1. received", "2. packed", "3. shipped"]
```

```fx-marble
title: loop separates its private state from its one output per event
covers: loop
input events: received . packed . shipped |
input accumulator: 1 . 2 . 3 .
operator: loop(position, label)
output labels: 1.received . 2.packed . 3.shipped |
```

The accumulator lane is private state, not a second Fx. `loopEffect` preserves the one-result shape,
but its output follows its Effect callback rather than the source delivery.

```fx-marble
title: loopEffect emits after each one-turn state transition resolves
covers: loopEffect
input events: received . packed . shipped . |
input accumulator: 1 . 2 . 3 . .
operator: loopEffect(position, oneTurnLabel)
output labels: . 1.received . 2.packed . 3.shipped |
```

## Map and filter while state still advances

`Fx.filterMapLoop` returns an `Option` with its next state. `None` suppresses that input's output,
but it still installs the returned state, which makes it useful for counters, alternating events,
and small parsers without a separate filter pass.

```fx-marble
title: filterMapLoop can update state without emitting a value
covers: filterMapLoop
input: a . b . c . d |
operator: filterMapLoop(0, everyOther)
output: 0:a . . . 2:c . |
```

`filterMapLoopEffect` keeps the zero-or-one decision, but resolves it through an Effect. It does not
serialize concurrent source deliveries, so use a serialized producer when this state must be atomic.

```fx-marble
title: filterMapLoopEffect makes each zero-or-one decision after its Effect resolves
covers: filterMapLoopEffect
input: a . b . c . d . |
operator: filterMapLoopEffect(0, oneTurnEveryOther)
output: . 0:a . . . 2:c . . |
```

The balance and position above are private to the pipeline run. If several independently created
parts of an application must read and write one current balance, model that capability with a
`RefSubject`; these transforms only derive values while an Fx is running.

## Turn repeated reports into transitions

An importer can repeat a status without a real transition. `Fx.skipRepeats` drops only consecutive
values equal under Effect's standard equality, then `Fx.pairwise` retains one prior emitted value
and exposes `[previous, current]`. `pairwise` emits nothing until it has seen two values.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const transitions = Fx.fromIterable(["received", "received", "packed", "packed", "shipped"]).pipe(
  Fx.skipRepeats,
  Fx.pairwise,
);

const values = await Effect.runPromise(Fx.collectAll(transitions));
// [["received", "packed"], ["packed", "shipped"]]
```

This is local change detection, not global de-duplication: a value may emit again after a different
one. Use `Fx.skipRepeatsWith` when the domain needs its own equivalence.

```fx-marble
title: skipRepeats removes only adjacent equivalents
covers: skipRepeats, skipRepeatsWith
input: received received packed packed shipped |
operator: skipRepeats / skipRepeatsWith(Eq)
output: received . packed . shipped |
```

Use `Fx.changesWithEffect` when that equivalence needs a service or can fail. It has the same
"compare to the last emitted value" rule, but serializes comparison Effects so one check completes
before the next starts.

```fx-marble
title: changesWithEffect waits for each equivalence check before deciding the next output
covers: changesWithEffect
input: received . received . packed . packed |
operator: changesWithEffect(sameStatus)
output: received . . . packed . . |
```

```fx-marble
title: pairwise waits for a prior value, then emits adjacent transitions
covers: pairwise
input: received . packed . shipped |
operator: pairwise
output: . . [received,packed] . [packed,shipped] |
```

## Batch writes without keeping the whole import

`Fx.grouped(n)` makes non-empty batches of at most `n` values. Full batches emit as soon as they
fill; when a finite run ends, its final partial batch is emitted too. It is the count-bound choice
when a database writer accepts small arrays.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const writes = Fx.fromIterable(["a", "b", "c", "d", "e"]).pipe(Fx.grouped(2));

const batches = await Effect.runPromise(Fx.collectAll(writes));
// [["a", "b"], ["c", "d"], ["e"]]
```

```fx-marble
title: grouped emits full batches and flushes the final partial batch
covers: grouped
input: a b c d e |
operator: grouped(2)
output: . [a,b] . [c,d] . [e] |
```

Choose `Fx.groupedWithin(n, duration)` when a batch should also flush after a time limit; it adds a
scoped timer requirement. Here the timer wins for `a`; the final `c` still flushes when the source
returns. Both grouping operators bound the retained buffer to a single batch, not the full source.
`n` must be a positive safe integer.

```fx-marble
title: groupedWithin flushes when its timer wins and again at source completion
covers: groupedWithin
input: a . . . c . |
operator: groupedWithin(3, 2 turns)
output: . . [a] . . . [c] |
```

## Make a terminal cause stateful only when the boundary needs it

`Fx.loopCause` leaves successful values alone and transforms each delivered terminal `Cause` with
private state. `Fx.filterMapLoopCause` additionally permits `None` to suppress forwarding that
Cause. These are error-boundary tools: use ordinary value transforms above for normal event state.

```fx-marble
title: loopCause rewrites a terminal cause after passing earlier values through
covers: loopCause
input source: loaded . cached . !offline
operator: loopCause(0, prefix)
output source: loaded . cached . !n0:offline
```

`loopCauseEffect` makes that terminal transformation asynchronous; this source's final Cause is
forwarded one turn after the callback starts.

```fx-marble
title: loopCauseEffect forwards its transformed terminal cause when its Effect resolves
covers: loopCauseEffect
input source: loaded . cached . !offline .
operator: loopCauseEffect(0, oneTurnPrefix)
output source: loaded . cached . . !n0:offline
```

```fx-marble
title: filterMapLoopCause can suppress a terminal cause
covers: filterMapLoopCause
input source: loaded . cached . !offline
operator: filterMapLoopCause(0, suppress)
output source: loaded . cached . |
```

`filterMapLoopCauseEffect` can make the same decision after work or a service lookup; its callback
also does not serialize concurrent failure deliveries.

```fx-marble
title: filterMapLoopCauseEffect completes only after its one-turn suppression decision
covers: filterMapLoopCauseEffect
input source: loaded . cached . !offline .
operator: filterMapLoopCauseEffect(0, oneTurnSuppress)
output source: loaded . cached . . |
```
