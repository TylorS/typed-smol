# Usage Reference: effect/Equivalence

- Import path: `effect/Equivalence`

## What It Is For

Utilities for defining equivalence relations - binary relations that determine when two values should be considered equivalent. Equivalence relations are used for comparing, deduplicating, and organizing data in collections and data structures.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Array, Equivalence } from "effect"

const caseInsensitive = Equivalence.make<string>((a, b) =>
  a.toLowerCase() === b.toLowerCase()
)

const strings = ["Hello", "world", "HELLO", "World"]
const deduplicated = Array.dedupeWith(strings, caseInsensitive)
console.log(deduplicated) // ["Hello", "world"]
```

## Test Anchors

- `packages/effect/test/Equivalence.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/Iterable.test.ts`
- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Record.test.ts`

## Top Symbols In Anchored Tests

- `make` (264)
- `Record` (134)
- `strictEqual` (113)
- `Equivalence` (88)
- `combine` (30)
- `Array` (17)
- `Number` (15)
- `String` (14)
- `mapInput` (9)
- `Boolean` (5)
- `Struct` (4)
- `BigInt` (3)
- `combineAll` (2)
- `makeReducer` (2)
- `Tuple` (2)
