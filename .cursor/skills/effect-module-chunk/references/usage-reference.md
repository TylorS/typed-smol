# Usage Reference: effect/Chunk

- Import path: `effect/Chunk`

## What It Is For

The `Chunk` module provides an immutable, high-performance sequence data structure optimized for functional programming patterns. A `Chunk` is a persistent data structure that supports efficient append, prepend, and concatenation operations.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Chunk } from "effect"

// Creating chunks
const chunk1 = Chunk.fromIterable([1, 2, 3])
const chunk2 = Chunk.fromIterable([4, 5, 6])
const empty = Chunk.empty<number>()

// Combining chunks
const combined = Chunk.appendAll(chunk1, chunk2)
console.log(Chunk.toReadonlyArray(combined)) // [1, 2, 3, 4, 5, 6]
```

## Test Anchors

- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Redacted.test.ts`
- `packages/effect/test/Result.test.ts`
- `packages/effect/test/TxChunk.test.ts`

## Top Symbols In Anchored Tests

- `Chunk` (658)
- `make` (265)
- `some` (203)
- `empty` (108)
- `fromArrayUnsafe` (48)
- `fromIterable` (42)
- `toReadonlyArray` (30)
- `get` (28)
- `of` (24)
- `appendAll` (21)
- `map` (19)
- `filter` (14)
- `getUnsafe` (14)
- `drop` (13)
- `take` (13)
