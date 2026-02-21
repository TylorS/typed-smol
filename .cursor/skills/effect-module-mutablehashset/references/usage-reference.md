# Usage Reference: effect/MutableHashSet

- Import path: `effect/MutableHashSet`

## What It Is For

MutableHashSet is a high-performance, mutable set implementation that provides efficient storage and retrieval of unique values. Built on top of MutableHashMap, it inherits the same performance characteristics and support for both structural and referential equality.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { MutableHashSet } from "effect";

// Create a mutable hash set
const set: MutableHashSet.MutableHashSet<string> = MutableHashSet.make("apple", "banana");

// Add elements
MutableHashSet.add(set, "cherry");

// Check if elements exist
console.log(MutableHashSet.has(set, "apple")); // true
console.log(MutableHashSet.has(set, "grape")); // false

// Iterate over elements
for (const value of set) {
  console.log(value); // "apple", "banana", "cherry"
}

// Get size
console.log(MutableHashSet.size(set)); // 3
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
