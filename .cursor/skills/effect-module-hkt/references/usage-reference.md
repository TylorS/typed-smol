# Usage Reference: effect/HKT

- Import path: `effect/HKT`

## What It Is For

This module provides utilities for Higher-Kinded Types (HKT) in TypeScript.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { HKT } from "effect";

// Define a TypeLambda for Array
interface ArrayTypeLambda extends HKT.TypeLambda {
  readonly type: Array<this["Target"]>;
}

// Use Kind to get the concrete type
type MyArray = HKT.Kind<ArrayTypeLambda, never, never, never, string>;
// MyArray is Array<string>

// Define a TypeClass that works with any HKT
interface Functor<F extends HKT.TypeLambda> extends HKT.TypeClass<F> {
  map<A, B>(
    fa: HKT.Kind<F, never, never, never, A>,
    f: (a: A) => B,
  ): HKT.Kind<F, never, never, never, B>;
}
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
