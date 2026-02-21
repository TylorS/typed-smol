---
name: effect-module-txhashset
description: Guidance for `effect/TxHashSet` focused on APIs like map, make, and empty. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxHashSet

## Owned scope

- Owns only `effect/TxHashSet`.
- Source of truth: `packages/effect/src/TxHashSet.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `make`
- `empty`
- `filter`
- `fromHashSet`
- `fromIterable`
- `isEmpty`
- `isSubset`
- `isTxHashSet`
- `add`
- `has`
- `size`
- `some`
- `clear`
- `every`
- `union`
- `Value`
- `reduce`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/TxHashSet.ts`
- Representative tests: `packages/effect/test/TxHashSet.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
