# Usage Reference: effect/String

- Import path: `effect/String`

## What It Is For

This module provides utility functions and type class instances for working with the `string` type in TypeScript. It includes functions for basic string manipulation.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { String } from "effect";
import * as assert from "node:assert";

assert.deepStrictEqual(String.isString("a"), true);
assert.deepStrictEqual(String.isString(1), false);
```

## Test Anchors

- `packages/effect/test/String.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Combiner.test.ts`
- `packages/effect/test/Metric.test.ts`
- `packages/effect/test/Option.test.ts`
- `packages/effect/test/Reducer.test.ts`

## Top Symbols In Anchored Tests

- `empty` (62)
- `String` (22)
- `length` (21)
- `Equivalence` (19)
- `Order` (18)
- `takeRight` (17)
- `ReducerConcat` (9)
- `replace` (9)
- `match` (7)
- `split` (7)
- `concat` (6)
- `isString` (3)
- `slice` (3)
- `localeCompare` (1)
- `stripMargin` (1)
