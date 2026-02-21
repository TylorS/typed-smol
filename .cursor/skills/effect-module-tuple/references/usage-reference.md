# Usage Reference: effect/Tuple

- Import path: `effect/Tuple`

## What It Is For

Utilities for creating, accessing, transforming, and comparing fixed-length arrays (tuples). Every function produces a new tuple — inputs are never mutated.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { pipe, Tuple } from "effect"

const point = Tuple.make(10, 20, "red")

const result = pipe(
  point,
  Tuple.evolve([
    (x) => x * 2,
    (y) => y * 2
  ])
)

console.log(result) // [20, 40, "red"]
```

## Test Anchors

- `packages/effect/test/Tuple.test.ts`
- `packages/effect/test/schema/Schema.test.ts`

## Top Symbols In Anchored Tests

- `make` (277)
- `map` (18)
- `omit` (15)
- `evolve` (12)
- `pick` (9)
- `renameIndices` (8)
- `mapPick` (6)
- `get` (5)
- `mapOmit` (5)
- `appendElement` (4)
- `appendElements` (2)
- `makeCombiner` (2)
- `makeReducer` (2)
