---
title: "Select values and bound cardinality"
summary: "Keep, omit, gate, and stop pushed values without confusing selection with cancellation policy."
section: "Fx"
kind: "guide"
order: 1.6
---

Imagine an import screen receiving a stream of raw status lines. It should ignore blank lines,
show the next two useful messages after its initial banner, and stop as soon as the import reaches
its terminal record. Those are three different decisions: *is this value useful?*, *where does the
window begin and end?*, and *which boundary value belongs in the result?* Keeping them separate
makes the pipeline easy to change without accidentally changing when it stops.

## Admit, omit, or transform

Use `Fx.filter` when the value stays the same and a synchronous predicate decides whether it
continues. Use `Fx.filterEffect` when that decision needs an `Effect`; its failures and services
become part of the resulting `Fx`.

When a value must be parsed or reshaped as it is admitted, reach for `Fx.filterMap`. `Option.some`
emits the new value and `Option.none` omits it. `Fx.filterMapEffect` is the same choice when parsing
or validation itself is effectful. This is a useful boundary: `filter` answers “keep this value?”,
while `filterMap` answers “can this value become the next value?”

For a producer that delivers values concurrently, effectful per-value checks can finish in a
different order than their inputs. Preserve or control that ordering at the producer boundary when
the order itself is part of the contract.

```ts
import { Option } from "effect";
import { Fx } from "@typed/fx";

const messages = Fx.fromIterable(["", "notice: connected", "ready", "done"]).pipe(
  Fx.filterMap((line) => {
    const separator = line.indexOf(": ");
    return separator < 0 ? Option.none() : Option.some(line.slice(separator + 2));
  }),
);
// Emits: ["connected"]
```

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const visible = Fx.fromIterable([
  { text: "private", allowed: false },
  { text: "queued", allowed: true },
]).pipe(Fx.filterEffect((message) => Effect.succeed(message.allowed)));
// Emits only the allowed message.
```

## Select a window, then decide where it closes

`Fx.skip(n)` discards a fixed prefix and then forwards everything else. `Fx.take(n)` forwards a
fixed prefix and completes. For a page or a window, `Fx.slice({ skip, take })` expresses both in one
place. `takeEffect`, `skipEffect`, and `sliceEffect` are for bounds that must be obtained at run
time; their Effect runs before the source is subscribed.

```ts
import { Fx } from "@typed/fx";

const page = Fx.fromIterable(["banner", "connected", "indexing", "complete", "ignored"]).pipe(
  Fx.slice({ skip: 1, take: 2 }),
);
// Emits: ["connected", "indexing"]
```

```fx-marble
title: skip removes only its fixed prefix
covers: skip, skipEffect
input: banner connected indexing |
operator: skip(1)
output: . connected indexing |
```

```fx-marble
title: take completes after its fixed prefix
covers: take, takeEffect
input: banner connected indexing |
operator: take(2)
output: banner connected | .
```

```fx-marble
title: slice keeps one bounded index window and then completes
covers: slice, sliceEffect
input: banner connected indexing complete ignored |
operator: slice({ skip: 1, take: 2 })
output: . connected indexing | . .
```

For a content boundary, choose the operator by what happens to the matching value:

- `Fx.skipWhile(predicate)` drops the true prefix; its exact alias is `Fx.dropWhile`.
- `Fx.dropUntil(predicate)` drops up to the first true value, then includes it and the rest.
- `Fx.takeWhile(predicate)` keeps the true prefix; `Fx.takeUntil(predicate)` keeps values before
  the first true sentinel.
- `Fx.dropAfter(predicate)` keeps the first true sentinel, then stops.

```ts
import { Fx } from "@typed/fx";

const beforeComplete = Fx.fromIterable(["connected", "indexing", "complete", "ignored"]).pipe(
  Fx.takeUntil((line) => line === "complete"),
);
// Emits: ["connected", "indexing"]

const throughComplete = Fx.fromIterable(["connected", "indexing", "complete", "ignored"]).pipe(
  Fx.dropAfter((line) => line === "complete"),
);
// Emits: ["connected", "indexing", "complete"]
```

```fx-marble
title: skipWhile drops a matching prefix, and dropWhile is its alias
covers: skipWhile, skipWhileEffect, dropWhile, dropWhileEffect
input: banner banner connected indexing |
operator: skipWhile(isBanner)
output: . . connected indexing |
```

```fx-marble
title: dropUntil includes the boundary that opens its gate
covers: dropUntil, dropUntilEffect
input: banner banner connected indexing |
operator: dropUntil(isConnected)
output: . . connected indexing |
```

```fx-marble
title: takeWhile stops before its first false value
covers: takeWhile, takeWhileEffect
input: connected indexing complete ignored |
operator: takeWhile(isInProgress)
output: connected indexing | . .
```

```fx-marble
title: takeUntil excludes its matching sentinel
covers: takeUntil, takeUntilEffect
input: connected indexing complete ignored |
operator: takeUntil(isComplete)
output: connected indexing | . .
```

```fx-marble
title: dropAfter includes its matching sentinel
covers: dropAfter
input: connected indexing complete ignored |
operator: dropAfter(isComplete)
output: connected indexing complete | .
```

The `While` forms describe a prefix rule; the `Until`/`After` forms make a named sentinel explicit.
That distinction matters when the terminal record is itself useful: use `dropAfter` for a final
status the user should see, and `takeUntil` when it is only a control marker. The `*Effect` forms
use the same output boundary after each check succeeds, while also exposing the check's failures
and services. `skipWhileEffect` and `dropUntilEffect` still run their predicate after the gate has
opened, so use a pure predicate when later checks should not happen.

## Open, close, or hold a gate with another Fx

`Fx.since(events, start)` drops events until `start` first emits. `Fx.until(events, stop)` forwards
events until `stop` emits, then interrupts the event run. `Fx.during(events, starts)` is the full
window: the first `starts` value is itself an Fx whose first value closes the gate.

```fx-marble
title: since opens when its named start signal emits
covers: since
input events: . draft . saved |
input start: . . open |
operator: since(events, start)
output: . . . saved |
```

```fx-marble
title: until stops when its named stop signal emits
covers: until
input events: draft . saved . later |
input stop: . . . stop |
operator: until(events, stop)
output: draft . saved | . .
```

```fx-marble
title: during forwards only while its named window is active
covers: during
input events: before . move . after . |
input drag: . down |
operator: during(events, drag)
inner stop: . ^ . . . up |
output: . . move . after | .
```

The signal values are control-only: none appear in the result. `since` keeps the event source alive
if its start signal fails; `until` and `during` instead propagate signal failures because their
signals own stopping work.

## Choose a value when a boolean changes

```fx-marble
title: when selects a value for each spaced condition
covers: when
input condition: true . false |
operator: when(condition, { onTrue, onFalse })
output: . open . closed |
```

With closely spaced boolean values, `when` can emit fewer values than condition pushes: a new value
may replace the previous constant branch before it emits.

Every counter and gate belongs to one run. Reaching `take`, `slice`, `takeWhile`, `takeUntil`, or
`dropAfter` completes downstream early and stops upstream work; it does not retain the whole source.
That early exit is not a replacement for resource ownership: a callback, socket, or other live
producer still needs its normal scoped cleanup. Put admission before a cardinality bound when the
bound means “useful messages,” and reverse them when it means “inspect at most this many raw
messages.”
