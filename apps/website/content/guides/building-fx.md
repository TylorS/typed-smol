---
title: Building Fx values
summary: Start with the smallest constructor that matches your producer, then add typed failure, services, and cleanup where they actually exist.
section: Fx
kind: guide
order: 1.1
---

An `Fx<A, E, R>` can push zero or more `A` values, fail with `E`, and require services `R`.
Construction is lazy: work begins when an Effect such as `Fx.observe` or `Fx.collectAll` runs it.

Start with the smallest constructor that tells the truth about the source.

## Start with one value

Use `Fx.succeed` when the value already exists. Use `Fx.sync` when it should be computed once for
each run. A thrown exception in `sync` is a defect; expected failure belongs in `Effect.try` and
`Fx.fromEffect`.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const constant = Fx.succeed("ready");
const requestedAt = Fx.sync(() => new Date());

const program = Fx.collectAll(requestedAt).pipe(Effect.map(([date]) => date.toISOString()));
```

Both Fx values emit exactly once and complete. Calling `Fx.collectAll(requestedAt)` still starts
nothing; the date is created only when the resulting Effect runs.

## Emit a finite collection

`Fx.fromIterable` gets a fresh iterator for each run, emits its values in order, and completes.
Arrays, sets, and generators fit here. They are finite input, not live state.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const ids = Fx.fromIterable(new Set(["ada", "grace", "barbara"]));
const program: Effect.Effect<ReadonlyArray<string>> = Fx.collectAll(ids);

const result = await Effect.runPromise(program);
```

`collectAll` is suitable because this source completes. Do not use it for an open event source: it
retains every value until completion.

## Lift an Effect

`Fx.fromEffect` runs one Effect per subscription. A success becomes one value; its full failure
Cause goes downstream; its error and service channels remain in the Fx type.

```ts
import { Context, Data, Effect, Layer } from "effect";
import { Fx } from "@typed/fx";

class RequestFailed extends Data.TaggedError("RequestFailed")<{
  readonly cause: unknown;
}> {}

interface ApiConfig {
  readonly endpoint: string;
}

const ApiConfig = Context.Service<ApiConfig>("docs/ApiConfig");

const request = Effect.gen(function* () {
  const config = yield* ApiConfig;
  return yield* Effect.tryPromise({
    try: () => fetch(config.endpoint).then((response) => response.text()),
    catch: (cause) => new RequestFailed({ cause }),
  });
});

const response: Fx.Fx<string, RequestFailed, ApiConfig> = Fx.fromEffect(request);
const ApiConfigLive = Layer.succeed(ApiConfig)({ endpoint: "/api/status" });
const program = Fx.first(response).pipe(Effect.provide(ApiConfigLive));
```

Use `Fx.fail(error)` for an immediate expected failure and `Fx.die(defect)` only for an unexpected
invariant violation. Effect's [error guide](https://www.effect.website/docs/v4/error-management/expected-errors/)
covers that distinction.

## Bring an Effect Stream across the boundary

Use `Fx.fromStream` when the producer already is an Effect Stream. It preserves values, failures,
services, finalizers, and the delivery options supplied to Stream's `mapEffect`.

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";

const source = Fx.fromStream(Stream.make(1, 2, 3));
const program = Fx.collectAll(source).pipe(
  Effect.map((values) => values.reduce((sum, value) => sum + value, 0)),
);
```

Use `Fx.toStream` in the other direction when an existing consumer needs Stream's pull model or
buffering policies. The adapter is lazy in both directions; the consumer owns the run.

## Use Effect's clock

`Fx.at(value, delay)` emits once after a delay. `Fx.periodic(period)` emits `void` after every period.
For a complete recurrence policy, use `Fx.fromSchedule`. All three use Effect's interruptible clock.

```ts
import { Effect, Fiber, Schedule } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { Fx } from "@typed/fx";

const finiteTicks = Fx.fromSchedule(Schedule.recurs(2));

const test = Effect.gen(function* () {
  const fiber = yield* Effect.forkChild(Fx.collectUpTo(Fx.periodic("1 second"), 2));
  yield* TestClock.adjust("2 seconds");
  return yield* Fiber.join(fiber);
});
```

There is no detached `setInterval`: interrupting the owner stops the wait and future ticks.

## Adapt a callback

`Fx.callback` is for DOM events, sockets, observers, and libraries that call a listener. Registration
runs once per subscription. Return an Effect that removes exactly what it installed.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const keydowns: Fx.Fx<KeyboardEvent> = Fx.callback((emit) => {
  const onKeydown = (event: KeyboardEvent) => emit.succeed(event);

  document.addEventListener("keydown", onKeydown);
  return Effect.sync(() => document.removeEventListener("keydown", onKeydown));
});

const shortcuts = keydowns.pipe(
  Fx.filter((event) => event.metaKey && event.key === "k"),
  Fx.map(() => "open-search" as const),
);
```

Creating `keydowns` installs nothing. Running an observer installs the listener; completion or
interruption removes it. `emit.succeed` starts asynchronous delivery immediately and returns the
running delivery Fiber. It is not a Promise, and `void` is not required. If ordering or completion
matters, coordinate that Fiber; otherwise the foreign callback may ignore its return value.
`Fx.callback` does not invent a queue or backpressure policy, so deliveries may overlap.

When setup acquires a resource that must remain alive with the callback, put both in `Fx.genScoped`.

```ts
import { Context, Effect } from "effect";
import { Fx } from "@typed/fx";

interface Connection {
  readonly listen: (f: (value: string) => void) => () => void;
  readonly close: Effect.Effect<void>;
}

interface Connections {
  readonly open: Effect.Effect<Connection>;
}

const Connections = Context.Service<Connections>("docs/Connections");

const messages: Fx.Fx<string, never, Connections> = Fx.genScoped(function* () {
  const connections = yield* Connections;
  const connection = yield* Effect.acquireRelease(connections.open, (open) => open.close);

  return Fx.callback<string>((emit) => {
    const stop = connection.listen((message) => emit.succeed(message));
    return Effect.sync(stop);
  });
});
```

Each run opens one connection. Callback cleanup removes its listener, then the subscription Scope
closes the connection. `genScoped` removes `Scope` from the public requirements while retaining the
real `Connections` requirement.
