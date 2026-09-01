---
title: State sources, equality, and lifetime
summary: Turn values and Effect producers into current state without hiding when updates start, repeat, or stop.
section: State
kind: guide
order: 2.05
---

`RefSubject` is the right boundary when a producer should become _current state_: readers can ask
for the latest value and observers can follow later distinct changes. It is not a way to disguise a
subscription. In particular, it matters both when the constructor Effect is run and when the input
producer is run.

Calling `RefSubject.make`, `fromEffect`, `fromFx`, or `fromStream` only creates an
[Effect](https://www.effect.website/docs/v4/getting-started/the-effect-type/) description. Executing
that Effect—usually `yield*`-ing it in an application-owned Scope—allocates the ref and its private
child Scope. What happens next depends on the input shape.

## An Effect is the lazy initial value

`fromEffect` constructs the ref without running its input Effect. The first current read, or the
first execution of an Fx observation of the ref, starts one initializer in the ref's private Scope.
Every concurrent reader waits for that same initializer. When it succeeds, the result becomes the
current value; the input Effect is not run again merely because another reader or observer arrives.
An ordinary `set` made before a first read supplies the current value instead, so there is no need to
run the initializer just to overwrite it.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

let starts = 0;

const makeProfileState = Effect.gen(function* () {
  const profile = yield* RefSubject.fromEffect(
    Effect.sync(() => {
      starts += 1;
      return { name: "Ada" };
    }),
  );

  // `starts` is still 0: constructing the ref did not run the source.
  const current = yield* profile;
  // `starts` is now 1. Later reads use the retained current value.

  return { current, starts };
});
```

The source Effect supplies the initial value only. Later values come from explicit `RefSubject` writes
or from a different live source; they do not cause a completed Effect to repeat.

## Fx and Stream begin when the ref is constructed

`fromFx` and `fromStream` also remain lazy until their constructor Effect is executed. Unlike
`fromEffect`, executing that constructor immediately forks one consumption of the source into the
ref's private Scope. It does not wait for a read or observer. The first current read waits until the
source publishes either a success or an expected failure; it does **not** wait for a finite source to
finish. Each later success replaces the current value and is offered to observers.

```ts
import { Effect, Stream } from "effect";
import { Fx, RefSubject } from "@typed/fx";

const makeConnectionState = Effect.gen(function* () {
  const presence = yield* RefSubject.fromFx(Fx.fromIterable(["connecting", "online"]));
  const events = yield* RefSubject.fromStream(Stream.fromIterable(["opened", "ready"]));

  // Both inputs already have one owner-run. This read waits only for `presence`'s first value.
  const currentPresence = yield* presence;

  return { presence, events, currentPresence };
});
```

So a finite Fx or Stream may already have advanced beyond the value returned by a later read, and a
read that unblocks on its first value may return before further values arrive. After an input ends,
the ref retains its most recent success or failure. It does not restart when a consumer leaves and a
new consumer arrives. Construct a new ref for a fresh input run. If source execution instead must
start with the first consumer, stop with the last, and restart for the next consumer session, keep
it as `Fx` and use `Subject.share`; that is a demand-sharing policy, not a RefSubject policy.

## Failures stay visible; services are captured at construction

An input's expected-error type `E` is preserved by the ref. A first failure releases waiting reads
with that error and is replayed to later observers; a source is not retried automatically. A later
successful `set` can replace that stored failure just as it can replace a stored success. Defects and
interruption remain Effect causes rather than being recast as expected state values.

Its required services `R` have a different lifetime: the constructor Effect requires them and captures
their current Context; the ref's private Scope owns the initializer or live-source worker that uses
that Context. Once construction has returned the ref, reading and observing that ref no longer
requires those source services. This keeps the dependency visible at the owning boundary without
asking every consumer to provide it.

```ts
import { Context, Data, Effect } from "effect";
import { RefSubject } from "@typed/fx";

class ProfileMissing extends Data.TaggedError("ProfileMissing")<{}> {}

class Profiles extends Context.Service<
  Profiles,
  {
    readonly load: Effect.Effect<{ readonly name: string }, ProfileMissing>;
  }
>()("docs/Profiles") {}

const source = Effect.flatMap(Profiles, ({ load }) => load);

const makeProfileState = Effect.gen(function* () {
  // Constructing requires `Profiles` and Scope; `profile` retains only `ProfileMissing` as E.
  const profile = yield* RefSubject.fromEffect(source);

  return yield* profile.pipe(
    Effect.catchTag("ProfileMissing", () => Effect.succeed({ name: "Guest" })),
  );
});
```

Provide `Profiles` where `makeProfileState` is constructed—an application Layer, a request scope, or
another real owner—not in every component that later consumes `profile`.

## Current state has one-value replay, and equality controls publications

Each ref retains one current `Exit`: its newest success or expected failure. A new observer first
receives that retained result, then follows later distinct commits. Therefore several observers of
one ref share its single initializer or its single Fx/Stream run; they do not create one source run
per consumer. `subscriberCount` reports those active observers for lifecycle diagnostics; it does
not include the ref-owned Fx or Stream source worker.

`RefSubjectOptions.eq` defines when two successful values count as the same. A value equivalent to
the prior success still becomes the value returned by a current read, but it does not advance
`version` or publish another update. Failure causes use structural Effect equality; a success and a
failure are always different. This makes equality a state contract shared by every consumer, not a
rendering shortcut.

```ts
import { Effect, Equivalence } from "effect";
import { RefSubject } from "@typed/fx";

const exerciseEquality = Effect.gen(function* () {
  const temperature = yield* RefSubject.make(
    { celsius: 20, sampledAt: 0 },
    { eq: Equivalence.make((left, right) => left.celsius === right.celsius) },
  );

  const versionBefore = yield* temperature.version;
  yield* RefSubject.set(temperature, { celsius: 20, sampledAt: 1 });

  return {
    current: yield* temperature,
    versionBefore,
    versionAfterEquivalentWrite: yield* temperature.version,
  };
});
```

Here the final current value has `sampledAt: 1`, while both versions are equal and observers receive
no second publication. The default equality is Effect's `Equal.equals`; choose a custom equivalence
only when it is the domain's definition of unchanged state.

## Give the source the lifetime it actually has

The Scope that executes construction owns the ref's private Scope, its Effect initializer or live
source fiber, and the retained one-value replay. Closing that owner interrupts a running source,
runs its finalizers, and interrupts active ref subscriptions. An individual observer has its own
subscription Scope: ending that consumer removes only that consumer and does not cancel the
Fx/Stream source held by the ref.

`ref.interrupt` is the explicit early-stop operation. It closes the private Scope, interrupts the
initializer and current subscribers, and clears pending initialization; it is not a restart command.
Use it when the real owner ends early.
