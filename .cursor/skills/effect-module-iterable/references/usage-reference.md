# Usage Reference: effect/Iterable

- Import path: `effect/Iterable`

## What It Is For

This module provides utility functions for working with Iterables in TypeScript.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Iterable } from "effect"

// Create iterables
const numbers = Iterable.range(1, 5)
const doubled = Iterable.map(numbers, (x) => x * 2)
const filtered = Iterable.filter(doubled, (x) => x > 5)

console.log(Array.from(filtered)) // [6, 8, 10]

// Infinite iterables
const fibonacci = Iterable.unfold([0, 1], ([a, b]) => [a, [b, a + b]])
const first10 = Iterable.take(fibonacci, 10)
console.log(Array.from(first10)) // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Test Anchors

- `packages/effect/test/Iterable.test.ts`

## Top Symbols In Anchored Tests

- `some` (32)
- `drop` (17)
- `findFirst` (13)
- `findLast` (13)
- `contains` (12)
- `intersperse` (11)
- `take` (10)
- `of` (9)
- `range` (9)
- `takeWhile` (9)
- `chunksOf` (8)
- `empty` (7)
- `scan` (7)
- `groupBy` (6)
- `append` (5)
