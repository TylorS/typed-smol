# Usage Reference: effect/Hash

- Import path: `effect/Hash`

## What It Is For

This module provides utilities for hashing values in TypeScript.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Hash } from "effect";

class MyClass implements Hash.Hash {
  constructor(private value: number) {}

  [Hash.symbol](): number {
    return Hash.hash(this.value);
  }
}

const instance = new MyClass(42);
console.log(instance[Hash.symbol]()); // hash value of 42
```

## Test Anchors

- `packages/effect/test/Equal.test.ts`
- `packages/effect/test/Graph.test.ts`
- `packages/effect/test/HashMap.test.ts`
- `packages/effect/test/HashSet.test.ts`
- `packages/effect/test/MutableHashMap.test.ts`
- `packages/effect/test/Option.test.ts`

## Top Symbols In Anchored Tests

- `number` (242)
- `string` (239)
- `Hash` (64)
- `hash` (56)
- `symbol` (42)
- `combine` (14)
- `array` (7)
- `structure` (4)
- `random` (2)
