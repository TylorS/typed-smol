---
name: effect-module-boolean
description: Guidance for `effect/Boolean` focused on APIs like isBoolean, or, and and. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Boolean

## Owned scope

- Owns only `effect/Boolean`.
- Source of truth: `packages/effect/src/Boolean.ts`.

## What it is for

- This module provides utility functions and type class instances for working with the `boolean` type in TypeScript. It includes functions for basic boolean operations.

## API quick reference

- `isBoolean`
- `or`
- `and`
- `eqv`
- `nor`
- `not`
- `xor`
- `nand`
- `some`
- `every`
- `match`
- `Order`
- `Boolean`
- `implies`
- `ReducerOr`
- `ReducerAnd`
- `Equivalence`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as Boolean from "effect/Boolean"

const bool = Boolean.Boolean(1)
console.log(bool) // true

const fromString = Boolean.Boolean("false")
console.log(fromString) // true (non-empty string)

const fromZero = Boolean.Boolean(0)
console.log(fromZero) // false
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Boolean.ts`
- Representative tests: `packages/effect/test/Boolean.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
