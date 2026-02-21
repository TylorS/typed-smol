---
name: effect-module-tuple
description: Guidance for `effect/Tuple` focused on APIs like get, map, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Tuple

## Owned scope

- Owns only `effect/Tuple`.
- Source of truth: `packages/effect/src/Tuple.ts`.

## What it is for

- Utilities for creating, accessing, transforming, and comparing fixed-length arrays (tuples). Every function produces a new tuple — inputs are never mutated.

## API quick reference

- `get`
- `map`
- `make`
- `mapOmit`
- `mapPick`
- `makeOrder`
- `makeReducer`
- `makeCombiner`
- `makeEquivalence`
- `omit`
- `pick`
- `evolve`
- `narrowing`
- `appendElement`
- `renameIndices`
- `appendElements`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { pipe, Tuple } from "effect"

const point = Tuple.make(10, 20, "red")

const result = pipe(
  point,
  Tuple.evolve([
    (x) => x * 2,
    (y) => y * 2
  ])
)

console.log(result) // [20, 40, "red"]
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Tuple.ts`
- Representative tests: `packages/effect/test/Tuple.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
