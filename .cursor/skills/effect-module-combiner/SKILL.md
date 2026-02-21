---
name: effect-module-combiner
description: Guidance for `effect/Combiner` focused on APIs like make, max, and min. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Combiner

## Owned scope

- Owns only `effect/Combiner`.
- Source of truth: `packages/effect/src/Combiner.ts`.

## What it is for

- A module for combining two values of the same type into one.

## API quick reference

- `make`
- `max`
- `min`
- `flip`
- `last`
- `first`
- `Combiner`
- `constant`
- `intercalate`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Combiner, String } from "effect";

const csv = Combiner.intercalate(",")(String.ReducerConcat);

console.log(csv.combine("a", "b"));
// Output: "a,b"

console.log(csv.combine(csv.combine("a", "b"), "c"));
// Output: "a,b,c"
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Combiner.ts`
- Representative tests: `packages/effect/test/Combiner.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
