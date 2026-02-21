---
name: effect-module-number
description: Guidance for `effect/Number` focused on APIs like parse, isNumber, and isLessThan. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Number

## Owned scope

- Owns only `effect/Number`.
- Source of truth: `packages/effect/src/Number.ts`.

## What it is for

- This module provides utility functions and type class instances for working with the `number` type in TypeScript. It includes functions for basic arithmetic operations.

## API quick reference

- `parse`
- `isNumber`
- `isLessThan`
- `isGreaterThan`
- `max`
- `min`
- `sum`
- `isGreaterThanOrEqualTo`
- `isLessThanOrEqualTo`
- `sign`
- `clamp`
- `Order`
- `round`
- `divide`
- `Number`
- `sumAll`
- `between`
- `multiply`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as N from "effect/Number"

const num = N.Number("42")
console.log(num) // 42

const float = N.Number("3.14")
console.log(float) // 3.14
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Number.ts`
- Representative tests: `packages/effect/test/Number.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Combiner.test.ts`
- Representative tests: `packages/effect/test/NullOr.test.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- Representative tests: `packages/effect/test/Record.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
