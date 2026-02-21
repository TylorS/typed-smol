# Usage Reference: effect/Array

- Import path: `effect/Array`

## What It Is For

Utilities for working with immutable arrays (and non-empty arrays) in a functional style. All functions treat arrays as immutable — they return new arrays rather than mutating the input.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Array } from "effect"

const numbers = Array.make(1, 2, 3, 4, 5)

const doubled = Array.map(numbers, (n) => n * 2)
console.log(doubled) // [2, 4, 6, 8, 10]

const evens = Array.filter(numbers, (n) => n % 2 === 0)
console.log(evens) // [2, 4]

const sum = Array.reduce(numbers, 0, (acc, n) => acc + n)
console.log(sum) // 15
```

## Test Anchors

- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`
- `packages/effect/test/ExecutionPlan.test.ts`
- `packages/effect/test/FiberMap.test.ts`

## Top Symbols In Anchored Tests

- `make` (555)
- `empty` (232)
- `Array` (151)
- `length` (118)
- `range` (84)
- `some` (79)
- `of` (67)
- `take` (62)
- `map` (61)
- `flatMap` (44)
- `drop` (42)
- `chunksOf` (40)
- `get` (36)
- `partition` (33)
- `join` (30)
