---
name: effect-module-bigint
description: Guidance for `effect/BigInt` focused on APIs like fromNumber, fromString, and isBigInt. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module BigInt

## Owned scope

- Owns only `effect/BigInt`.
- Source of truth: `packages/effect/src/BigInt.ts`.

## What it is for

- This module provides utility functions and type class instances for working with the `bigint` type in TypeScript. It includes functions for basic arithmetic operations.

## API quick reference

- `fromNumber`
- `fromString`
- `isBigInt`
- `isLessThan`
- `abs`
- `gcd`
- `isGreaterThan`
- `lcm`
- `max`
- `min`
- `sum`
- `isGreaterThanOrEqualTo`
- `isLessThanOrEqualTo`
- `sign`
- `sqrt`
- `clamp`
- `Order`
- `BigInt`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as BigInt from "effect/BigInt"

const bigInt = BigInt.BigInt(123)
console.log(bigInt) // 123n

const fromString = BigInt.BigInt("456")
console.log(fromString) // 456n
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/BigInt.ts`
- Representative tests: `packages/effect/test/BigInt.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
