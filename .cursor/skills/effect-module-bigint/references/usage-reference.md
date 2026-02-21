# Usage Reference: effect/BigInt

- Import path: `effect/BigInt`

## What It Is For

This module provides utility functions and type class instances for working with the `bigint` type in TypeScript. It includes functions for basic arithmetic operations.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as BigInt from "effect/BigInt";

const bigInt = BigInt.BigInt(123);
console.log(bigInt); // 123n

const fromString = BigInt.BigInt("456");
console.log(fromString); // 456n
```

## Test Anchors

- `packages/effect/test/BigInt.test.ts`

## Top Symbols In Anchored Tests

- `BigInt` (17)
- `ReducerMultiply` (6)
- `ReducerSum` (6)
- `Equivalence` (3)
- `CombinerMax` (2)
- `CombinerMin` (2)
