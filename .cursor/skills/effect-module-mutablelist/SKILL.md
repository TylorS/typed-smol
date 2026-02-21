---
name: effect-module-mutablelist
description: Guidance for `effect/MutableList` focused on APIs like make, Empty, and filter. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module MutableList

## Owned scope

- Owns only `effect/MutableList`.
- Source of truth: `packages/effect/src/MutableList.ts`.

## What it is for

- MutableList is an efficient, mutable linked list implementation optimized for high-throughput scenarios like logging, queuing, and streaming. It uses a bucket-based architecture where elements are stored in arrays (buckets) linked together, providing optimal performance for both append and prepend operations.

## API quick reference

- `make`
- `Empty`
- `filter`
- `take`
- `clear`
- `takeN`
- `append`
- `Bucket`
- `remove`
- `prepend`
- `takeAll`
- `toArray`
- `toArrayN`
- `appendAll`
- `takeNVoid`
- `prependAll`
- `MutableList`
- `appendAllUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as MutableList from "effect/MutableList"

// Create a mutable list
const list: MutableList.MutableList<number> = MutableList.make()

// Add elements
MutableList.append(list, 1)
MutableList.append(list, 2)
MutableList.prepend(list, 0)

// Access properties
console.log(list.length) // 3
console.log(list.head?.array) // Contains elements from head bucket
console.log(list.tail?.array) // Contains elements from tail bucket

// Take elements
console.log(MutableList.take(list)) // 0
console.log(MutableList.take(list)) // 1
console.log(MutableList.take(list)) // 2
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/MutableList.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
