---
name: effect-module-txhashmap
description: Guidance for `effect/TxHashMap` focused on APIs like get, map, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxHashMap

## Owned scope

- Owns only `effect/TxHashMap`.
- Source of truth: `packages/effect/src/TxHashMap.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `map`
- `set`
- `make`
- `empty`
- `filter`
- `flatMap`
- `getHash`
- `setMany`
- `filterMap`
- `fromIterable`
- `hasBy`
- `hasHash`
- `isEmpty`
- `isNonEmpty`
- `isTxHashMap`
- `has`
- `Key`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/TxHashMap.ts`
- Representative tests: `packages/effect/test/TxHashMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
