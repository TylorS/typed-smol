# Usage Reference: effect/TxHashSet

- Import path: `effect/TxHashSet`

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
import { Effect, TxHashSet } from "effect"

const program = Effect.gen(function*() {
  // Create a transactional hash set
  const txSet = yield* TxHashSet.make("apple", "banana", "cherry")

  // Single operations are automatically transactional
  yield* TxHashSet.add(txSet, "grape")
  const hasApple = yield* TxHashSet.has(txSet, "apple")
  console.log(hasApple) // true

  // Multi-step atomic operations
  yield* Effect.atomic(
    Effect.gen(function*() {
      const hasCherry = yield* TxHashSet.has(txSet, "cherry")
      if (hasCherry) {
        yield* TxHashSet.remove(txSet, "cherry")
        yield* TxHashSet.add(txSet, "orange")
      }
    })
  )

  const size = yield* TxHashSet.size(txSet)
  console.log(size) // 4
```

## Test Anchors

- `packages/effect/test/TxHashSet.test.ts`

## Top Symbols In Anchored Tests

- `TxHashSet` (181)
- `size` (48)
- `make` (36)
- `has` (34)
- `empty` (20)
- `add` (11)
- `isEmpty` (9)
- `toHashSet` (8)
- `isSubset` (7)
- `remove` (7)
- `fromIterable` (6)
- `intersection` (6)
- `isTxHashSet` (6)
- `map` (5)
- `reduce` (5)
