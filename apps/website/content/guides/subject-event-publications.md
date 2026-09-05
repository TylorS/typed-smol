---
title: "Subject: publish events to many consumers"
summary: "Connect independently owned producers and consumers through one scoped, typed publication boundary."
section: "Fx"
kind: "guide"
order: 1.17
---

`Subject<A, E, R>` is a multicast publication boundary: it is an `Fx` that consumers subscribe to
and a `Sink` that producers publish into. Reach for it when the next value is an event—an incoming
message, a command, a connection transition, or an application notification—not a current value
that somebody must be able to read now.

Think of `Subject` as the point where a Sink gains an Fx side. Producers use the Sink operations
`onSuccess` and `onFailure`; consumers use the Fx side through `Fx.observe`, `take`, `merge`, and
the rest of the Fx vocabulary. A plain [Sink](/explore/sink-writing-effects) stops at the write
boundary. A Subject additionally distributes each publication to its active observers.

That distinction is the useful line between `Subject` and `RefSubject`. A `RefSubject` retains one
current success or failure, so `yield* ref` samples current state and a new observer sees that
current value. A `Subject` has no current-value read. With its default replay capacity of `0`, a
consumer sees only publications that begin after it subscribes. Give it replay only when late
consumers genuinely need prior events; do not turn an event log into state by accident.

## Construct the boundary under its real owner

`Subject.make(replay?)` is an Effect: acquiring it requires `Scope`, and closing that Scope
interrupts its active subscribers and clears retained replay. Its capacity is an explicit memory
policy: `0` retains nothing, `1` holds the latest publication, and a larger number retains that
many successes or failures in FIFO order. Invalid capacities fail with `Cause.IllegalArgumentError`.

Subscribe before publishing. The subscription remains active until its Scope ends, while each
`onSuccess` waits for the snapshot of subscribers present for that publication to receive it.

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const program = Effect.scoped(
  Effect.gen(function* () {
    const connectionEvents = yield* Subject.make<string>(1);
    const received = yield* Fx.collectAllFork(Fx.take(connectionEvents, 2));

    while ((yield* connectionEvents.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* connectionEvents.onSuccess("connected");
    yield* connectionEvents.onSuccess("ready");

    return yield* Fiber.join(received);
  }),
);

await Effect.runPromise(program); // ["connected", "ready"]
```

`Subject.unsafeMake` is synchronous, starts no work, and does not install that finalizer. Use it
only when another concrete owner will call `interrupt`, such as a small adapter or a test. Prefer
`make` at application, request, feature, or Layer boundaries so retained values and subscriptions
cannot outlive the owner.

## Observe publications; publish through the Sink side

`Fx.observe(subject, handler)` is the normal callback-shaped consumer. It starts only when its
returned Effect runs and belongs to that Effect's Scope. The same subject also accepts another Fx
through `source.run(subject)`, or a direct producer through `onSuccess` and `onFailure`.

Publications are serialized in FIFO order, including concurrent and reentrant writes. A subscriber
set is captured once per publication: an observer added while a value is draining starts with the
next publication, while an observer removed during delivery receives no later one. These are event
delivery semantics; they are not a replacement for a state transition that needs a readable result.

```ts
import { Effect, Ref } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const program = Effect.scoped(
  Effect.gen(function* () {
    const notifications = yield* Subject.make<string>();
    const seen = yield* Ref.make<ReadonlyArray<string>>([]);

    yield* Effect.forkScoped(
      Fx.observe(notifications, (message) => Ref.update(seen, (all) => [...all, message])),
    );
    while ((yield* notifications.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* notifications.onSuccess("saved");

    return yield* Ref.get(seen);
  }),
);
```

## Keep failures in the event channel

`E` is the type of failures a producer may publish. Call `onFailure` with the complete
`Cause<E>`, not merely a string or an erased exception. A failure is delivered to the subscribers
present for that publication; it does not permanently close the subject. A later `onSuccess` is
valid. Defects and interruption also remain represented in `Cause`, which lets a Sink decide how
to report or recover them at the boundary where it has enough context.

```ts
import { Cause, Data, Effect, Ref } from "effect";
import { Sink } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

class ConnectionLost extends Data.TaggedError("ConnectionLost")<{}> {}

const program = Effect.scoped(
  Effect.gen(function* () {
    const events = yield* Subject.make<string, ConnectionLost>();
    const values = yield* Ref.make<ReadonlyArray<string>>([]);
    const failures = yield* Ref.make(0);
    const sink = Sink.make<string, ConnectionLost>(
      () => Ref.update(failures, (count) => count + 1),
      (value) => Ref.update(values, (all) => [...all, value]),
    );

    yield* Effect.forkScoped(events.run(sink));
    while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* events.onFailure(Cause.fail(new ConnectionLost()));
    yield* events.onSuccess("reconnected");

    return { failures: yield* Ref.get(failures), values: yield* Ref.get(values) };
  }),
);
```

The subject itself adds `Scope` to its `Fx` side because every subscription has an owner. Its
generic `R` remains visible for service-backed subjects and sinks: provide services at the
subscription or publication boundary instead of hiding them in a module-global event bus.

## Put cross-cutting events in Context deliberately

`Subject.Service` defines a class-shaped Effect service that is at once a `Subject`, `Fx`, and
`Sink`. Its `.make(replay?)` creates the scoped Layer. This is a useful boundary for events shared
by independently constructed routes, workers, or adapters; it is not a reason to move local
feature events into Context.

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

class Notifications extends Subject.Service<Notifications, string>()("docs/Notifications") {}

const program = Effect.scoped(
  Effect.gen(function* () {
    const received = yield* Fx.collectAllFork(Fx.take(Notifications, 1));

    while ((yield* Notifications.subscriberCount) < 1) yield* Effect.yieldNow;
    yield* Notifications.onSuccess("invoice saved");
    return yield* Fiber.join(received);
  }).pipe(Effect.provide(Notifications.make(1))),
);
```

`subscriberCount` is a diagnostic and coordination read: it reports active sinks without creating
a subscription. `interrupt` closes every current subscription and clears replay, but the subject
can be subscribed to and published through again afterwards. It is the explicit early-stop action;
Scope closure is the usual ownership mechanism.

## Choose the sharing policy at the source boundary

The `@typed/fx/Subject` submodule also adapts a producer `Fx` to a demand-shared one. The first
subscriber starts one source execution; the last leaves interrupts it; a later subscriber starts a
fresh execution. `Subject.multicast` has no replay, `Subject.hold` replays the most recent exit,
and `Subject.replay(n)` retains a caller-chosen window. `Subject.share(source, subject)` is for the
rare case where the caller must choose the exact subject, such as a service-backed or replaying
boundary. Do not concurrently reuse that selected subject for an unrelated producer population.

```ts
import { Fx } from "@typed/fx";
import * as Subject from "@typed/fx/Subject";

const source = Fx.fromIterable(["connecting", "online"]);
const liveOnly = Subject.multicast(source);
const latest = Subject.hold(source);
const recent = source.pipe(Subject.replay(2));

const selectedPolicy = Subject.share(source, Subject.unsafeMake<string>(2));
```

## Test the publication contract directly

Use a scoped test and observe or collect a finite slice. `Fx.collectAllFork(Fx.take(subject, n))`
starts the subscriber without making the test depend on a renderer, and `subscriberCount` makes the
subscription boundary observable. Wait until the expected subscriber count is present before
publishing; a single scheduler yield does not establish that condition. Test replay, failure delivery, ordering, and cleanup
at this boundary; test a `RefSubject` transition separately when the claim is about current state.

```ts
import { Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import { Fx } from "@typed/fx"
import * as Subject from "@typed/fx/Subject"

it.effect("publishes to the active subscriber", Effect.fn("publishesToActiveSubscriber")(function* () {
  const events = yield* Subject.make<number>()
  const received = yield* Fx.collectAllFork(Fx.take(events, 2))

  while ((yield* events.subscriberCount) < 1) yield* Effect.yieldNow
  expect(yield* events.subscriberCount).toBe(1)
  yield* events.onSuccess(1)
  yield* events.onSuccess(2)
  expect(yield* Fiber.join(received)).toEqual([1, 2])
}))
```
