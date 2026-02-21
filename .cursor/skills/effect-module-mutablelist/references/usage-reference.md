# Usage Reference: effect/MutableList

- Import path: `effect/MutableList`

## What It Is For

MutableList is an efficient, mutable linked list implementation optimized for high-throughput scenarios like logging, queuing, and streaming. It uses a bucket-based architecture where elements are stored in arrays (buckets) linked together, providing optimal performance for both append and prepend operations.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
