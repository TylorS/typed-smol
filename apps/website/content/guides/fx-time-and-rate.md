---
title: "Model time, repetition, and rate"
summary: "Put clocks, quiet periods, rate windows, and retries in the Fx graph with explicit cancellation."
section: "Fx"
kind: "guide"
order: 1.7
---

An event can mean “later,” “after the burst settles,” “at most once per window,” or “keep trying.”
Those are different timing rules, so model the rule at the `Fx` boundary instead of adding an
unmanaged timer around its consumer.

## Delay one value, wait for quiet, or limit a rate

Use `Fx.at` for one value that should arrive later. Use `Fx.delay` when every source value must
still arrive, in order, after the same delay. Use `Fx.debounce` when only the latest value after a
quiet period matters. Use `Fx.throttle` when immediate feedback is useful but a source must not
deliver more often than a window allows.

```ts
import { Fx } from "@typed/fx";

const notice = Fx.at("saved", "1 second");
const paced = Fx.fromIterable([1, 2, 3]).pipe(Fx.delay("100 millis"));

const edits = Fx.fromIterable(["t", "ty", "typed"]);
const settledEdits = edits.pipe(Fx.debounce("250 millis"));
const previews = edits.pipe(
  Fx.throttle({ duration: "100 millis", leading: true, trailing: true }),
);

const settledValues = Fx.collectAll(settledEdits);
```

```fx-marble
title: delay shifts every value by 100ms (two 50ms slots)
covers: delay
input: a . b . c |
operator: delay(100ms)
output: . . a . b . c |
```

```fx-marble
title: debounce emits 250ms after the final value (50ms slots)
covers: debounce
input: t . ty . typed . . . . . |
operator: debounce(250ms)
output: . . . . . . . . . typed |
```

```fx-marble
title: throttle keeps leading and trailing values in a 100ms window (50ms slots)
covers: throttle
input: t ty . . next . . |
operator: throttle({ duration: 100ms, leading: true, trailing: true })
output: t . ty . next . . |
```

Debounce replaces an in-flight quiet-period timer whenever a newer value arrives. Throttle opens a
fixed window: the duration-only form is leading-edge; `{ leading: true, trailing: true }` also
keeps the latest value seen during that window. Both add `Scope` to the resulting `Fx`, because a
subscription owns the timer and any pending value.

## Make a clock, or subscribe again after completion

`Fx.periodic` emits `void` after each full period; the first tick is not immediate. For a custom or
finite clock, use `Fx.fromSchedule`. `Fx.repeat` is different: it starts a fresh, sequential
subscription only after the previous source completes successfully. It does not repeat each value
and never overlaps attempts.

```ts
import { Effect, Schedule } from "effect";
import { Fx } from "@typed/fx";

const threeHeartbeats = Fx.collectAll(Fx.periodic("1 minute").pipe(Fx.take(3)));
const threeScheduledTicks = Fx.collectAll(Fx.fromSchedule(Schedule.recurs(2)));

const pollAttempt = Fx.succeed("updated");
const threePolls = Fx.collectAll(pollAttempt.pipe(Fx.repeat(Schedule.recurs(2))));

const program: Effect.Effect<ReadonlyArray<string>> = threePolls;
```

A schedule supplies the timing and stopping policy for `fromSchedule`, `repeat`, and `Fx.retry`.
Its failure and service requirements join the source's `E` and `R`, so a schedule that needs a
service or can fail remains visible to the caller rather than escaping through a callback.

```fx-marble
title: repeat starts a fresh run only after the previous run completes
covers: repeat
input source: ^ poll |
operator: repeat(Schedule.recurs(2))
inner repeat-1: . . ^ poll |
inner repeat-2: . . . . ^ poll |
output: . poll . poll . poll |
```

## Decide what silence means

`Fx.timeout` treats an idle interval as normal completion. `Fx.timeoutTo` instead interrupts the
quiet source and transfers output to a fallback `Fx`. Both reset their clock after every emitted
value, so they detect the gap before the first value as well as gaps between later values.

```ts
import { Fx } from "@typed/fx";

const heartbeat = Fx.periodic("1 second");
const connectionEnded = heartbeat.pipe(Fx.timeout("2 seconds"));
const availability = heartbeat.pipe(Fx.timeoutTo("2 seconds", Fx.succeed("offline")));

const availabilityValues = Fx.collectAll(availability);
```

```fx-marble
title: timeout completes normally after two seconds of silence (1s slots)
covers: timeout
input source: ^ beat beat . x
input timeout: ^ . . . |
operator: timeout(2 seconds)
output: . beat beat . |
```

```fx-marble
title: timeoutTo cancels the source and hands off to its fallback
covers: timeoutTo
input source: ^ beat beat . x
input timeout: ^ . . . |
inner fallback: . . . . ^ offline |
operator: timeoutTo(2 seconds, fallback)
output: . beat beat . . offline |
```

`timeout` preserves the source's value, failure, and service types. `timeoutTo` combines those
channels with the fallback's, because either producer may become the active one.

## Model a drag from pointerdown to pointerup

A drag is a window opened by one producer and closed by another. `pointerdown` selects the pointer,
matching `pointermove` events produce positions, and either `pointerup` or `pointercancel` closes the
window. The next `pointerdown` starts a new drag.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

type DragEvent =
  | { readonly _tag: "Start"; readonly pointerId: number; readonly x: number; readonly y: number }
  | {
      readonly _tag: "Move";
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
      readonly dx: number;
      readonly dy: number;
    }
  | { readonly _tag: "End"; readonly pointerId: number };

const pointerEvents = (target: EventTarget, type: string): Fx.Fx<PointerEvent> =>
  Fx.callback((emit) => {
    const onPointer = (event: Event) => {
      if (event instanceof PointerEvent) emit.succeed(event);
    };

    target.addEventListener(type, onPointer);
    return Effect.sync(() => target.removeEventListener(type, onPointer));
  });

export const dragEvents = (handle: HTMLElement) => {
  const starts = pointerEvents(handle, "pointerdown").pipe(
    Fx.filter((event) => event.button === 0),
  );
  const moves = pointerEvents(document, "pointermove");
  const ends = Fx.mergeAll(
    pointerEvents(document, "pointerup"),
    pointerEvents(document, "pointercancel"),
  );

  return starts.pipe(
    Fx.switchMap((start) => {
      const matchingMoves = moves.pipe(
        Fx.filter((event) => event.pointerId === start.pointerId),
        Fx.map(
          (event): DragEvent => ({
            _tag: "Move",
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dx: event.clientX - start.clientX,
            dy: event.clientY - start.clientY,
          }),
        ),
      );
      const stop = ends.pipe(
        Fx.filter((event) => event.pointerId === start.pointerId),
        Fx.take(1),
      );

      return matchingMoves.pipe(
        Fx.until(stop),
        Fx.prepend({
          _tag: "Start",
          pointerId: start.pointerId,
          x: start.clientX,
          y: start.clientY,
        } as const),
        Fx.append({ _tag: "End", pointerId: start.pointerId } as const),
      );
    }),
  );
};
```

`Fx.callback` is the native DOM boundary here: registration is lazy, and its cleanup Effect removes
the real event listener when observation ends. `emit.succeed` starts sink delivery immediately and
returns its Fiber; the DOM callback does not wait for that Fiber. `until(stop)` interrupts the
matching move source as soon as the terminating event arrives. `switchMap` makes a newer
`pointerdown` replace an unfinished gesture instead of leaving two drags active.

For a single bounded window, `Fx.during(events, starts)` accepts a start Fx whose first value is the
stop Fx. It discards event values before that start and after the stop. The explicit `switchMap` and
`until` form above is more useful for drag-and-drop because it retains the starting coordinates and
can open another window for every gesture.

## Let the subscription own the timer

Constructing an `Fx` starts no clock. Running a consumer starts the subscription; completion,
failure, and interruption cancel pending sleeps and close its `Scope`. A finite runner can own that
Scope until its result completes. A live clock belongs to a longer-lived application, request, or
feature Scope. In tests, advance Effect's `TestClock` instead of waiting on wall time.
