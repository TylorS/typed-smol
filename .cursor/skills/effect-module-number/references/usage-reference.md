# Usage Reference: effect/Number

- Import path: `effect/Number`

## What It Is For

This module provides utility functions and type class instances for working with the `number` type in TypeScript. It includes functions for basic arithmetic operations.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as N from "effect/Number";

const num = N.Number("42");
console.log(num); // 42

const float = N.Number("3.14");
console.log(float); // 3.14
```

## Test Anchors

- `packages/effect/test/Number.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Combiner.test.ts`
- `packages/effect/test/NullOr.test.ts`
- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Record.test.ts`

## Top Symbols In Anchored Tests

- `Number` (38)
- `Equivalence` (26)
- `Order` (18)
- `ReducerSum` (12)
- `max` (6)
- `min` (6)
- `ReducerMax` (6)
- `ReducerMin` (6)
- `ReducerMultiply` (6)
- `parse` (4)
- `sum` (1)
- `sumAll` (1)
