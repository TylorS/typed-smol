---
name: effect-module-data
description: Guidance for `effect/Data` focused on APIs like GenericMatchers, Args, and Kind. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Data

## Owned scope

- Owns only `effect/Data`.
- Source of truth: `packages/effect/src/Data.ts`.

## What it is for

- This module provides utilities for creating data types with structural equality semantics. Unlike regular JavaScript objects, `Data` types support value-based equality comparison using the `Equal` module.

## API quick reference

- `GenericMatchers`
- `Args`
- `Kind`
- `Class`
- `Error`
- `Value`
- `taggedEnum`
- `TaggedEnum`
- `Constructor`
- `TaggedClass`
- `TaggedError`
- `WithGenerics`
- `ConstructorFrom`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Data, Equal } from "effect"
import * as assert from "node:assert"

class Person extends Data.Class<{ readonly name: string }> {}

// Creating instances of Person
const mike1 = new Person({ name: "Mike" })
const mike2 = new Person({ name: "Mike" })
const john = new Person({ name: "John" })

// Checking equality
assert.deepStrictEqual(Equal.equals(mike1, mike2), true)
assert.deepStrictEqual(Equal.equals(mike1, john), false)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Data.ts`
- Representative tests: `packages/effect/test/Layer.test.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Pathfinding.test.ts`
- Representative tests: `packages/effect/test/RcMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
