---
name: effect-module-mutablehashmap
description: Guidance for `effect/MutableHashMap` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module MutableHashMap

## Owned scope

- Owns only `effect/MutableHashMap`.
- Source of truth: `packages/effect/src/MutableHashMap.ts`.

## What it is for

- MutableHashMap is a high-performance, mutable hash map implementation designed for efficient key-value storage with support for both structural and referential equality. It provides O(1) average-case performance for basic operations and integrates seamlessly with Effect's Equal and Hash interfaces.

## API quick reference

- `get`
- `set`
- `make`
- `empty`
- `fromIterable`
- `isEmpty`
- `has`
- `keys`
- `size`
- `clear`
- `modify`
- `remove`
- `values`
- `forEach`
- `modifyAt`
- `MutableHashMap`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import * as MutableHashMap from "effect/MutableHashMap"

// Create a mutable hash map with string keys and number values
const map: MutableHashMap.MutableHashMap<string, number> = MutableHashMap
  .empty()

// Add some data
MutableHashMap.set(map, "count", 42)
MutableHashMap.set(map, "total", 100)

// Use as iterable
for (const [key, value] of map) {
  console.log(`${key}: ${value}`)
}
// Output:
// count: 42
// total: 100

// Convert to array
const entries = Array.from(map)
console.log(entries) // [["count", 42], ["total", 100]]
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/MutableHashMap.ts`
- Representative tests: `packages/effect/test/MutableHashMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
