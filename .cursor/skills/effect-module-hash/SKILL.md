---
name: effect-module-hash
description: Guidance for `effect/Hash` focused on APIs like hash, Hash, and isHash. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Hash

## Owned scope

- Owns only `effect/Hash`.
- Source of truth: `packages/effect/src/Hash.ts`.

## What it is for

- This module provides utilities for hashing values in TypeScript.

## API quick reference

- `hash`
- `Hash`
- `isHash`
- `array`
- `number`
- `random`
- `string`
- `symbol`
- `combine`
- `optimize`
- `structure`
- `structureKeys`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Hash.ts`
- Representative tests: `packages/effect/test/Equal.test.ts`
- Representative tests: `packages/effect/test/Graph.test.ts`
- Representative tests: `packages/effect/test/HashMap.test.ts`
- Representative tests: `packages/effect/test/HashSet.test.ts`
- Representative tests: `packages/effect/test/MutableHashMap.test.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
