# Usage Reference: effect/Order

- Import path: `effect/Order`

## What It Is For

This module provides the `Order` type class for defining total orderings on types. An `Order` is a comparison function that returns `-1` (less than), `0` (equal), or `1` (greater than).

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Order } from "effect";

const result = Order.Number(5, 10);
console.log(result); // -1 (5 is less than 10)

const isLessThan = Order.isLessThan(Order.Number)(5, 10);
console.log(isLessThan); // true
```

## Test Anchors

- `packages/effect/test/Order.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/schema/Schema.test.ts`

## Top Symbols In Anchored Tests

- `make` (538)
- `String` (359)
- `Struct` (193)
- `Number` (179)
- `Order` (61)
- `Tuple` (55)
- `Boolean` (34)
- `Array` (30)
- `Date` (22)
- `isGreaterThan` (16)
- `isBetween` (11)
- `BigInt` (10)
- `max` (10)
- `min` (10)
- `clamp` (9)
