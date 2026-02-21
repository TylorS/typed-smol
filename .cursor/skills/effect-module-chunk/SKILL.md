---
name: effect-module-chunk
description: Guidance for `effect/Chunk` focused on APIs like of, get, and map. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Chunk

## Owned scope

- Owns only `effect/Chunk`.
- Source of truth: `packages/effect/src/Chunk.ts`.

## What it is for

- The `Chunk` module provides an immutable, high-performance sequence data structure optimized for functional programming patterns. A `Chunk` is a persistent data structure that supports efficient append, prepend, and concatenation operations.

## API quick reference

- `of`
- `get`
- `map`
- `make`
- `empty`
- `filter`
- `makeBy`
- `flatMap`
- `mapAccum`
- `filterMap`
- `fromIterable`
- `filterMapWhile`
- `makeEquivalence`
- `getUnsafe`
- `fromArrayUnsafe`
- `fromNonEmptyArrayUnsafe`
- `isChunk`
- `isEmpty`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Chunk.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- Representative tests: `packages/effect/test/Redacted.test.ts`
- Representative tests: `packages/effect/test/Result.test.ts`
- Representative tests: `packages/effect/test/TxChunk.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
