# Usage Reference: effect/Boolean

- Import path: `effect/Boolean`

## What It Is For

This module provides utility functions and type class instances for working with the `boolean` type in TypeScript. It includes functions for basic boolean operations.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Boolean from "effect/Boolean"

const bool = Boolean.Boolean(1)
console.log(bool) // true

const fromString = Boolean.Boolean("false")
console.log(fromString) // true (non-empty string)

const fromZero = Boolean.Boolean(0)
console.log(fromZero) // false
```

## Test Anchors

- `packages/effect/test/Boolean.test.ts`

## Top Symbols In Anchored Tests

- `Boolean` (31)
- `ReducerAnd` (13)
- `ReducerOr` (13)
- `Equivalence` (5)
