# Usage Reference: effect/TxChunk

- Import path: `effect/TxChunk`

## What It Is For

TxChunk is a transactional chunk data structure that provides Software Transactional Memory (STM) semantics for chunk operations. It uses a `TxRef<Chunk<A>>` internally to ensure all operations are performed atomically within transactions.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Chunk, Effect, TxChunk } from "effect"

const program = Effect.gen(function*() {
  // Create a transactional chunk
  const txChunk: TxChunk.TxChunk<number> = yield* TxChunk.fromIterable([
    1,
    2,
    3
  ])

  // Single operations - no explicit transaction needed
  yield* TxChunk.append(txChunk, 4)
  const result = yield* TxChunk.get(txChunk)
  console.log(Chunk.toReadonlyArray(result)) // [1, 2, 3, 4]

  // Multi-step atomic operation - use explicit transaction
  yield* Effect.atomic(
    Effect.gen(function*() {
      yield* TxChunk.prepend(txChunk, 0)
      yield* TxChunk.append(txChunk, 5)
    })
  )

  const finalResult = yield* TxChunk.get(txChunk)
```

## Test Anchors

- `packages/effect/test/TxChunk.test.ts`

## Top Symbols In Anchored Tests

- `TxChunk` (74)
- `fromIterable` (28)
- `get` (20)
- `empty` (9)
- `isEmpty` (8)
- `isNonEmpty` (8)
- `size` (6)
- `concat` (5)
- `append` (4)
- `map` (3)
- `prepend` (3)
- `slice` (3)
- `appendAll` (2)
- `drop` (2)
- `filter` (2)
