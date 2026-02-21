# Usage Reference: effect/Reducer

- Import path: `effect/Reducer`

## What It Is For

A module for reducing collections of values into a single result.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Reducer } from "effect";

const Sum = Reducer.make<number>((a, b) => a + b, 0);

console.log(Sum.combine(3, 4));
// Output: 7

console.log(Sum.combineAll([1, 2, 3, 4]));
// Output: 10

console.log(Sum.combineAll([]));
// Output: 0
```

## Test Anchors

- `packages/effect/test/Reducer.test.ts`

## Top Symbols In Anchored Tests

- `flip` (2)
- `Reducer` (2)
