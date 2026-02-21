# Usage Reference: effect/Data

- Import path: `effect/Data`

## What It Is For

This module provides utilities for creating data types with structural equality semantics. Unlike regular JavaScript objects, `Data` types support value-based equality comparison using the `Equal` module.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Pathfinding.test.ts`
- `packages/effect/test/RcMap.test.ts`

## Top Symbols In Anchored Tests

- `TaggedError` (24)
- `Error` (21)
- `Class` (2)
- `TaggedClass` (1)
