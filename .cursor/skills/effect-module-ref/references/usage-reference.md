# Usage Reference: effect/Ref

- Import path: `effect/Ref`

## What It Is For

This module provides utilities for working with mutable references in a functional context.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Ref } from "effect";

const program = Effect.gen(function* () {
  // Create a ref with initial value
  const counter = yield* Ref.make(0);

  // Atomic operations
  yield* Ref.update(counter, (n) => n + 1);
  yield* Ref.update(counter, (n) => n * 2);

  const value = yield* Ref.get(counter);
  console.log(value); // 2

  // Atomic modify with return value
  const previous = yield* Ref.getAndSet(counter, 100);
  console.log(previous); // 2
});
```

## Test Anchors

- `packages/effect/test/Ref.test.ts`
- `packages/effect/test/Resource.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/FiberHandle.test.ts`
- `packages/effect/test/FiberMap.test.ts`
- `packages/effect/test/FiberSet.test.ts`

## Top Symbols In Anchored Tests

- `Ref` (89)
- `make` (64)
- `set` (45)
- `get` (29)
- `update` (21)
- `getAndUpdateSome` (5)
- `modifySome` (5)
- `updateSome` (5)
- `updateSomeAndGet` (5)
- `getAndSet` (2)
- `getAndUpdate` (2)
- `modify` (2)
- `updateAndGet` (2)
- `makeUnsafe` (1)
