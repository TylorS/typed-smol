# Usage Reference: effect/PubSub

- Import path: `effect/PubSub`

## What It Is For

This module provides utilities for working with publish-subscribe (PubSub) systems.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.

## Starter Example

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

## Test Anchors

- `packages/effect/test/PubSub.test.ts`

## Top Symbols In Anchored Tests

- `PubSub` (151)
- `subscribe` (40)
- `publishAll` (30)
- `take` (24)
- `takeAll` (20)
- `unbounded` (11)
- `dropping` (10)
- `publish` (9)
- `bounded` (8)
- `sliding` (8)
- `capacity` (5)
- `takeUpTo` (4)
- `make` (2)
- `remaining` (2)
- `size` (2)
