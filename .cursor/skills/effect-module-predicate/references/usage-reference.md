# Usage Reference: effect/Predicate

- Import path: `effect/Predicate`

## What It Is For

Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Predicate from "effect/Predicate";

const isPositive = (n: number) => n > 0;
const data = [2, -1, 3];

console.log(data.filter(isPositive));
```

## Test Anchors

- `packages/effect/test/Predicate.test.ts`
- `packages/effect/test/Iterable.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toIso.test.ts`

## Top Symbols In Anchored Tests

- `Predicate` (206)
- `Struct` (200)
- `some` (157)
- `and` (63)
- `Tuple` (61)
- `not` (22)
- `or` (15)
- `hasProperty` (13)
- `isObjectKeyword` (11)
- `every` (10)
- `isObject` (9)
- `isTruthy` (9)
- `isString` (8)
- `isTagged` (8)
- `isIterable` (7)
