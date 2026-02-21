# Usage Reference: effect/TxHashMap

- Import path: `effect/TxHashMap`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Option, TxHashMap } from "effect"

const program = Effect.gen(function*() {
  // Create a transactional hash map
  const txMap = yield* TxHashMap.make(["user1", "Alice"], ["user2", "Bob"])

  // Single operations are automatically transactional
  yield* TxHashMap.set(txMap, "user3", "Charlie")
  const user = yield* TxHashMap.get(txMap, "user1")
  console.log(user) // Option.some("Alice")

  // Multi-step atomic operations
  yield* Effect.atomic(
    Effect.gen(function*() {
      const currentUser = yield* TxHashMap.get(txMap, "user1")
      if (Option.isSome(currentUser)) {
        yield* TxHashMap.set(txMap, "user1", currentUser.value + "_updated")
        yield* TxHashMap.remove(txMap, "user2")
      }
    })
  )

  const size = yield* TxHashMap.size(txMap)
  console.log(size) // 2
```

## Test Anchors

- `packages/effect/test/TxHashMap.test.ts`

## Top Symbols In Anchored Tests

- `TxHashMap` (247)
- `size` (71)
- `some` (58)
- `make` (49)
- `get` (47)
- `empty` (28)
- `set` (16)
- `entries` (15)
- `has` (15)
- `values` (15)
- `map` (11)
- `hasHash` (10)
- `filter` (9)
- `getHash` (9)
- `isEmpty` (9)
