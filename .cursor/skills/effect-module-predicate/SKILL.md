---
name: effect-module-predicate
description: Guidance for `effect/Predicate` focused on APIs like mapInput, isMap, and isSet. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Predicate

## Owned scope

- Owns only `effect/Predicate`.
- Source of truth: `packages/effect/src/Predicate.ts`.

## What it is for

- Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## API quick reference

- `mapInput`
- `isMap`
- `isSet`
- `isDate`
- `isNull`
- `isError`
- `isNever`
- `isBigInt`
- `isNumber`
- `isObject`
- `isRegExp`
- `isString`
- `isSymbol`
- `isTagged`
- `isTruthy`
- `isBoolean`
- `isNotNull`
- `isNullish`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as Predicate from "effect/Predicate"

const isPositive = (n: number) => n > 0
const data = [2, -1, 3]

console.log(data.filter(isPositive))
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-predicate-combinators` (effect/Predicate#combinators)
  - `effect-facet-predicate-core` (effect/Predicate#core)
  - `effect-facet-predicate-guards` (effect/Predicate#guards)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-predicate-combinators`.

## Reference anchors

- Module source: `packages/effect/src/Predicate.ts`
- Representative tests: `packages/effect/test/Predicate.test.ts`
- Representative tests: `packages/effect/test/Iterable.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toIso.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
