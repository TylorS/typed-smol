---
name: effect-module-pubsub
description: Guidance for `effect/PubSub` focused on APIs like make, makeAtomicBounded, and makeAtomicUnbounded. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module PubSub

## Owned scope

- Owns only `effect/PubSub`.
- Source of truth: `packages/effect/src/PubSub.ts`.

## What it is for

- This module provides utilities for working with publish-subscribe (PubSub) systems.

## API quick reference

- `make`
- `makeAtomicBounded`
- `makeAtomicUnbounded`
- `isFull`
- `isEmpty`
- `isShutdown`
- `size`
- `take`
- `Atomic`
- `PubSub`
- `bounded`
- `publish`
- `sliding`
- `takeAll`
- `capacity`
- `dropping`
- `shutdown`
- `Strategy`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, PubSub } from "effect";

const program = Effect.gen(function* () {
  const pubsub = yield* PubSub.bounded<string>(10);

  // Publisher
  yield* PubSub.publish(pubsub, "Hello");
  yield* PubSub.publish(pubsub, "World");

  // Subscriber
  yield* Effect.scoped(
    Effect.gen(function* () {
      const subscription = yield* PubSub.subscribe(pubsub);
      const message1 = yield* PubSub.take(subscription);
      const message2 = yield* PubSub.take(subscription);
      console.log(message1, message2); // "Hello", "World"
    }),
  );
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/PubSub.ts`
- Representative tests: `packages/effect/test/PubSub.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
