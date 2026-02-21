---
name: effect-module-order
description: Guidance for `effect/Order` focused on APIs like make, mapInput, and makeReducer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Order

## Owned scope

- Owns only `effect/Order`.
- Source of truth: `packages/effect/src/Order.ts`.

## What it is for

- This module provides the `Order` type class for defining total orderings on types. An `Order` is a comparison function that returns `-1` (less than), `0` (equal), or `1` (greater than).

## API quick reference

- `make`
- `mapInput`
- `makeReducer`
- `isBetween`
- `isLessThan`
- `isGreaterThan`
- `max`
- `min`
- `Date`
- `flip`
- `isGreaterThanOrEqualTo`
- `isLessThanOrEqualTo`
- `Array`
- `clamp`
- `Order`
- `Tuple`
- `BigInt`
- `Number`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Order } from "effect"

const result = Order.Number(5, 10)
console.log(result) // -1 (5 is less than 10)

const isLessThan = Order.isLessThan(Order.Number)(5, 10)
console.log(isLessThan) // true
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Order.ts`
- Representative tests: `packages/effect/test/Order.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
