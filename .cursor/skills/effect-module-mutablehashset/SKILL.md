---
name: effect-module-mutablehashset
description: Guidance for `effect/MutableHashSet` focused on APIs like make, empty, and fromIterable. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module MutableHashSet

## Owned scope

- Owns only `effect/MutableHashSet`.
- Source of truth: `packages/effect/src/MutableHashSet.ts`.

## What it is for

- MutableHashSet is a high-performance, mutable set implementation that provides efficient storage and retrieval of unique values. Built on top of MutableHashMap, it inherits the same performance characteristics and support for both structural and referential equality.

## API quick reference

- `make`
- `empty`
- `fromIterable`
- `add`
- `has`
- `size`
- `clear`
- `remove`
- `MutableHashSet`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/MutableHashSet.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
