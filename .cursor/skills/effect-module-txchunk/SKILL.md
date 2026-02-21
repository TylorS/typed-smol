---
name: effect-module-txchunk
description: Guidance for `effect/TxChunk` focused on APIs like get, map, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxChunk

## Owned scope

- Owns only `effect/TxChunk`.
- Source of truth: `packages/effect/src/TxChunk.ts`.

## What it is for

- TxChunk is a transactional chunk data structure that provides Software Transactional Memory (STM) semantics for chunk operations. It uses a `TxRef<Chunk<A>>` internally to ensure all operations are performed atomically within transactions.

## API quick reference

- `get`
- `map`
- `set`
- `make`
- `empty`
- `filter`
- `update`
- `fromIterable`
- `makeUnsafe`
- `isEmpty`
- `isNonEmpty`
- `drop`
- `size`
- `take`
- `slice`
- `append`
- `concat`
- `modify`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/TxChunk.ts`
- Representative tests: `packages/effect/test/TxChunk.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
