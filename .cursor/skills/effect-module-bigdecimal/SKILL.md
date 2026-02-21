---
name: effect-module-bigdecimal
description: Guidance for `effect/BigDecimal` focused on APIs like make, fromBigInt, and fromNumber. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module BigDecimal

## Owned scope

- Owns only `effect/BigDecimal`.
- Source of truth: `packages/effect/src/BigDecimal.ts`.

## What it is for

- This module provides utility functions and type class instances for working with the `BigDecimal` type in TypeScript. It includes functions for basic arithmetic operations.

## API quick reference

- `make`
- `fromBigInt`
- `fromNumber`
- `fromString`
- `fromNumberUnsafe`
- `fromStringUnsafe`
- `makeNormalizedUnsafe`
- `isZero`
- `isInteger`
- `isLessThan`
- `isNegative`
- `isPositive`
- `isBigDecimal`
- `abs`
- `isGreaterThan`
- `max`
- `min`
- `sum`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { BigDecimal } from "effect"

const d = BigDecimal.fromNumberUnsafe(123.45)

d.value // 12345n
d.scale // 2
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/BigDecimal.ts`
- Representative tests: `packages/effect/test/BigDecimal.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toEquivalence.test.ts`
- Representative tests: `packages/effect/test/schema/toFormatter.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
