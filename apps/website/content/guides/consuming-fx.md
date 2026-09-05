---
title: "Consuming Fx"
summary: "Choose the runner that matches what your application needs from a producer."
section: "Fx"
kind: "guide"
order: 1.99
---

An `Fx` is a producer. Consuming it is not one operation: sometimes you need to react to every
value, sometimes you need one answer, and sometimes you only need to know that the work ended.
Start with that need. Most consumers return an `Effect`, so failures, required services, and
lifetime stay in the program that owns the subscription.

## I need to react to every value

Use `Fx.observe` when each value causes work: update a `Ref`, write a record, send a metric, or
call another Effect. The callback can fail or need services; those requirements become part of the
returned Effect. The subscription ends when the source ends.

```ts
import { Effect, Ref } from "effect";
import { Fx } from "@typed/fx";

const events = Fx.fromIterable(["saved", "published"]);

const program = Effect.gen(function* () {
  const handled = yield* Ref.make<ReadonlyArray<string>>([]);
  yield* Fx.observe(events, (event) => Ref.update(handled, (all) => [...all, event]));
  return yield* Ref.get(handled);
});
```

`observe` is the usual answer for a live producer. It does not add its own queue or concurrency
policy; the source and the operators before it determine delivery.

## I need one answer

Use `Fx.first` when the next step needs the first value. It returns `Option<A>`: `None` means the
source completed without a value, while a source failure remains in the error channel. After the
first value, it stops upstream.

```ts
import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";

const selections = Fx.fromIterable(["typed", "effect"]);

const selectedWorkspace = Fx.first(selections).pipe(
  Effect.flatMap(
    Option.match({
      onNone: () => Effect.fail("no workspace selected" as const),
      onSome: Effect.succeed,
    }),
  ),
);
```

Treat absence as data when it is expected. Turn it into a domain error only at the point where the
caller truly requires a value.

## I need the finite output

Use `Fx.collectAll` for a producer known to complete, such as an import, a generated report, or a
test fixture. It makes the cost explicit: every value stays in memory until completion.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const importedRows = Fx.fromIterable(["Ada", "Grace", "Edsger"]);

const report = Fx.collectAll(importedRows).pipe(
  Effect.map((rows) => ({ count: rows.length, rows })),
);

const preview = Fx.collectUpTo(importedRows, 2);
```

`collectUpTo(fx, n)` is the bounded version: it retains at most `n` values and stops upstream at
that bound. It is useful for a finite sample of an open event source, provided that many values
will actually arrive. Use `observe` for continuous processing and `collectAll` only when completion
is part of the source contract.

## I only need completion

Use `Fx.drain` when the useful work already happens inside the producer and its operators. It runs
the subscription without building an array of values.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const migrations = Fx.fromIterable(["users", "projects"]).pipe(
  Fx.tap((table) => Effect.log(`migrated ${table}`)),
);

const runMigrations: Effect.Effect<void> = Fx.drain(migrations);
```

The result still fails if the source or its per-value work fails. `drain` changes what you keep,
not what you supervise.

## My next consumer already expects a Stream

Use `Fx.toStream` at that boundary. It is lazy: running the Stream starts the Fx subscription, and
the Stream scope owns the adapter's queue and cleanup. Stay with the Effect-returning consumers
when the next step does not need Stream semantics.

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";

const temperatures = Fx.fromIterable([18, 20, 21, 23]);

const average = Stream.runFold(
  Fx.toStream(temperatures),
  () => ({ total: 0, count: 0 }),
  (state, value) => ({ total: state.total + value, count: state.count + 1 }),
);
```

## This process should run for the application lifetime

Build the observer as part of the application program, then fork it in the Scope that the actual
application entry point owns. The process stays live while the application does; when the host
releases that scope, the Fiber is interrupted and the producer cleans up.

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";

const heartbeats = Fx.periodic("10 seconds");

const application = Effect.gen(function* () {
  yield* Effect.forkScoped(Fx.observe(heartbeats, () => Effect.log("connection alive")));

  yield* Effect.never;
});

const fiber = Effect.runFork(Effect.scoped(application));

// Called by the real application host when it shuts down.
const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

The Scope remains open for the same lifetime as the application and closes when `stop` interrupts
its Fiber.
In a Layer-based application, `Fx.observeLayer` and `Fx.drainLayer` attach the same kind of
background subscription to the application's Layer scope.

## I am at the application or test boundary

`Fx.runPromise` and `Fx.runPromiseExit` start a root subscription on Effect's default runtime.
Use them in a CLI `main`, a test harness, or another foreign host only after providing all services.
Inside an Effect application, keep composing with `observe`, `drain`, or a collector instead.

```ts
import { Effect, Exit } from "effect";
import { Fx } from "@typed/fx";

const main = async () => {
  const exit = await Fx.runPromiseExit(Fx.fromEffect(Effect.log("service ready")));

  if (Exit.isFailure(exit)) {
    console.error(exit.cause);
  }
};

await main();
```

For a host that must keep a live producer running, `Fx.runFork` returns the root Fiber; that host
owns interrupting it when it shuts down.
