# Usage Reference: effect/MutableHashMap

- Import path: `effect/MutableHashMap`

## What It Is For

MutableHashMap is a high-performance, mutable hash map implementation designed for efficient key-value storage with support for both structural and referential equality. It provides O(1) average-case performance for basic operations and integrates seamlessly with Effect's Equal and Hash interfaces.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/MutableHashMap.test.ts`

## Top Symbols In Anchored Tests

- `set` (22)
- `has` (10)
- `size` (9)
- `empty` (8)
- `make` (8)
- `get` (6)
- `MutableHashMap` (5)
- `modifyAt` (4)
- `modify` (3)
- `remove` (3)
- `fromIterable` (2)
- `keys` (2)
- `values` (2)
