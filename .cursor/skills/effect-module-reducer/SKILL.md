---
name: effect-module-reducer
description: Guidance for `effect/Reducer` focused on APIs like make, flip, and Reducer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Reducer

## Owned scope

- Owns only `effect/Reducer`.
- Source of truth: `packages/effect/src/Reducer.ts`.

## What it is for

- A module for reducing collections of values into a single result.

## API quick reference

- `make`
- `flip`
- `Reducer`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Reducer } from "effect"

const Sum = Reducer.make<number>((a, b) => a + b, 0)

console.log(Sum.combine(3, 4))
// Output: 7

console.log(Sum.combineAll([1, 2, 3, 4]))
// Output: 10

console.log(Sum.combineAll([]))
// Output: 0
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Reducer.ts`
- Representative tests: `packages/effect/test/Reducer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
