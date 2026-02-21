# Usage Reference: effect/Types

- Import path: `effect/Types`

## What It Is For

Type-level utility types for TypeScript.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Types } from "effect"

// Exactly 3 numbers
const triple: Types.TupleOf<3, number> = [1, 2, 3]

// @ts-expect-error - too few elements
const tooFew: Types.TupleOf<3, number> = [1, 2]

// @ts-expect-error - too many elements
const tooMany: Types.TupleOf<3, number> = [1, 2, 3, 4]
```

## Test Anchors

- `packages/effect/test/Pathfinding.test.ts`

## Top Symbols In Anchored Tests

- `Mutable` (1)
