---
name: effect-module-string
description: Guidance for `effect/String` focused on APIs like empty, isEmpty, and isString. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module String

## Owned scope

- Owns only `effect/String`.
- Source of truth: `packages/effect/src/String.ts`.

## What it is for

- This module provides utility functions and type class instances for working with the `string` type in TypeScript. It includes functions for basic string manipulation.

## API quick reference

- `empty`
- `isEmpty`
- `isString`
- `isNonEmpty`
- `at`
- `trim`
- `Trim`
- `match`
- `Order`
- `slice`
- `split`
- `charAt`
- `concat`
- `Concat`
- `length`
- `noCase`
- `padEnd`
- `repeat`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { String } from "effect"
import * as assert from "node:assert"

assert.deepStrictEqual(String.isString("a"), true)
assert.deepStrictEqual(String.isString(1), false)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/String.ts`
- Representative tests: `packages/effect/test/String.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Combiner.test.ts`
- Representative tests: `packages/effect/test/Metric.test.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- Representative tests: `packages/effect/test/Reducer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
