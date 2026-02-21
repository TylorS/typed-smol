# Usage Reference: effect/HashSet

- Import path: `effect/HashSet`

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

## Test Anchors

- `packages/effect/test/HashSet.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/TxHashSet.test.ts`

## Top Symbols In Anchored Tests

- `make` (346)
- `HashSet` (152)
- `has` (79)
- `size` (71)
- `some` (67)
- `empty` (40)
- `map` (24)
- `add` (17)
- `filter` (15)
- `isEmpty` (14)
- `isSubset` (12)
- `remove` (11)
- `union` (10)
- `every` (8)
- `fromIterable` (8)
