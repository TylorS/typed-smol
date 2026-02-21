---
name: effect-module-hkt
description: Guidance for `effect/HKT` focused on APIs like URI, Kind, and TypeClass. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module HKT

## Owned scope

- Owns only `effect/HKT`.
- Source of truth: `packages/effect/src/HKT.ts`.

## What it is for

- This module provides utilities for Higher-Kinded Types (HKT) in TypeScript.

## API quick reference

- `URI`
- `Kind`
- `TypeClass`
- `TypeLambda`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { HKT } from "effect"

// Define a TypeLambda for Array
interface ArrayTypeLambda extends HKT.TypeLambda {
  readonly type: Array<this["Target"]>
}

// Use Kind to get the concrete type
type MyArray = HKT.Kind<ArrayTypeLambda, never, never, never, string>
// MyArray is Array<string>

// Define a TypeClass that works with any HKT
interface Functor<F extends HKT.TypeLambda> extends HKT.TypeClass<F> {
  map<A, B>(
    fa: HKT.Kind<F, never, never, never, A>,
    f: (a: A) => B
  ): HKT.Kind<F, never, never, never, B>
}
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/HKT.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
