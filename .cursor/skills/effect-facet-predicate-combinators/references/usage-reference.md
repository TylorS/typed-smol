# Usage Reference: effect/Predicate#combinators

- Import path: `effect/Predicate#combinators`

## What It Is For

logical predicate composition. Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## How To Use

- Keep work focused on the `combinators` concern for `effect/Predicate`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Predicate from "effect/Predicate"

const isPositive = (n: number) => n > 0
const data = [2, -1, 3]

console.log(data.filter(isPositive))
```

## Test Anchors

- `packages/effect/test/Predicate.test.ts`
- `packages/effect/test/Iterable.test.ts`

## Top Symbols In Anchored Tests

- `compose` (3)
