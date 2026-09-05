---
title: "Choose an Fx producer dynamically"
summary: "Use setup Effects to select or construct an Fx, then choose whether its Scope belongs to the caller or the subscription."
section: "Fx"
kind: "guide"
order: 1.15
---

Sometimes the producer is not known when you declare the pipeline. Configuration, a capability
check, or a typed setup Effect can choose which `Fx` should run. `gen`, `unwrap`, and `unwrapScoped`
make that choice part of the lazy subscription instead of starting setup while the value is built.

## Run setup, then the selected Fx

The setup Effect runs once for each observation. Its success value is an `Fx`, not an emitted value;
that Fx is subscribed immediately afterward. If setup fails, the selected Fx never starts. Values,
failures, and services from both phases remain visible on the returned `Fx`.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

type Mode = "cached" | "live";

const producerFor = Effect.fn("producerFor")((mode: Mode) =>
  Effect.succeed(
    mode === "cached" ? Fx.succeed("cached") : Fx.fromIterable(["live:connected", "live:ready"]),
  ),
);

const selected = Fx.unwrap(producerFor("live"));
const values = Fx.collectAll(selected);
```

Use `unwrap` when the setup Effect already exists or is easiest to express with ordinary Effect
combinators. It preserves the same phase boundary without adding a Scope. Interruption stops setup
or the selected Fx, whichever is active, and their own finalizers still run when they have a Scope
requirement.

```fx-marble
title: setup selects a producer before the selected Fx emits
covers: gen, unwrap
input setup: ^ choose |
operator: unwrap(setup) / gen(setup)
inner selected Fx: . . ^ a b |
output: . . . a b |
```

## Use gen for linear setup

`gen` is the generator-shaped form of the same operation. Yield Effects for the setup steps and
return the `Fx` to run. It is useful when selection depends on several typed values or services;
the final `return` is the producer boundary, not another output event.

```ts
import { Context, Effect } from "effect";
import { Fx } from "@typed/fx";

class FeedConfig extends Context.Service<FeedConfig, {
  readonly mode: "cached" | "live";
  readonly label: string;
}>()("app/FeedConfig") {}

const generated = Fx.gen(function* () {
  const { mode, label } = yield* FeedConfig;

  return mode === "cached"
    ? Fx.succeed(`${label}:cached`)
    : Fx.fromIterable([`${label}:connected`, `${label}:ready`]);
});

const values = Fx.collectAll(generated).pipe(
  Effect.provideService(FeedConfig, { mode: "live", label: "activity" }),
);
```

`gen` keeps the setup and producer in one readable block. Conceptually, it is `unwrap` applied to
the `Effect.gen` program you would otherwise write by hand. Use `Effect.fn` for a reusable setup
function that takes arguments; use `Fx.gen` when the setup itself is the construction of one lazy
producer.

## Make setup and streaming share a subscription Scope

Use `unwrapScoped` when the setup Effect acquires a resource that must stay alive while the selected
Fx runs. Each observation opens one Scope, runs setup and the selected Fx inside it, then closes
that Scope after normal completion, failure, or interruption. `Scope` is removed from the returned
Fx's requirements; other services remain required.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const connection = Fx.unwrapScoped(
  Effect.gen(function* () {
    const handle = yield* Effect.acquireRelease(Effect.succeed({ name: "market-feed" }), () =>
      Effect.log("connection closed"),
    );

    return Fx.fromIterable([`${handle.name}:connected`, `${handle.name}:ready`]);
  }),
);

const first = Fx.first(connection);
```

The resource is released when this subscription ends, so the producer cannot outlive the handle it
needs. `unwrapScoped` owns setup for the selected producer's subscription; use plain `unwrap` when
setup already has an independently managed lifetime.

```fx-marble
title: unwrapScoped keeps setup resources alive through streaming
covers: unwrapScoped
input setup: ^ acquire | . . .
operator: unwrapScoped(setup)
inner subscription Scope: ^ open . . . . close |
inner selected Fx: . . . ^ a b | .
output: . . . . a b | .
```

Choose the combinator from the lifetime rule: `gen` for linear setup that returns an Fx, `unwrap`
for an existing setup Effect without Scope ownership, and `unwrapScoped` when this subscription must
own setup resources through the selected producer's lifetime.
