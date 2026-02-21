---
name: effect-module-hashset
description: Guidance for `effect/HashSet` focused on APIs like map, make, and empty. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module HashSet

## Owned scope

- Owns only `effect/HashSet`.
- Source of truth: `packages/effect/src/HashSet.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `make`
- `empty`
- `filter`
- `fromIterable`
- `HashSet`
- `isEmpty`
- `isSubset`
- `isHashSet`
- `add`
- `has`
- `size`
- `some`
- `every`
- `union`
- `Value`
- `reduce`
- `remove`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import * as HashSet from "effect/HashSet"

// Create a HashSet
const set = HashSet.make("apple", "banana", "cherry")

// Check membership
console.log(HashSet.has(set, "apple")) // true
console.log(HashSet.has(set, "grape")) // false

// Add values (returns new HashSet)
const updated = HashSet.add(set, "grape")
console.log(HashSet.size(updated)) // 4

// Remove values (returns new HashSet)
const smaller = HashSet.remove(set, "banana")
console.log(HashSet.size(smaller)) // 2
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/HashSet.ts`
- Representative tests: `packages/effect/test/HashSet.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/TxHashSet.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
