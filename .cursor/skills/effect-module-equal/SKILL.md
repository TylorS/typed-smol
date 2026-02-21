---
name: effect-module-equal
description: Guidance for `effect/Equal` focused on APIs like makeCompareMap, makeCompareSet, and isEqual. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Equal

## Owned scope

- Owns only `effect/Equal`.
- Source of truth: `packages/effect/src/Equal.ts`.

## What it is for

- This module provides functionality for defining and working with equality between values. It includes the `Equal` interface for types that can determine equality with other values of the same type, and utilities for comparing values.

## API quick reference

- `makeCompareMap`
- `makeCompareSet`
- `isEqual`
- `Equal`
- `equals`
- `symbol`
- `byReference`
- `asEquivalence`
- `byReferenceUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Equal, Hash } from "effect"

class Coordinate implements Equal.Equal {
  constructor(readonly x: number, readonly y: number) {}

  [Equal.symbol](that: Equal.Equal): boolean {
    return that instanceof Coordinate &&
      this.x === that.x &&
      this.y === that.y
  }

  [Hash.symbol](): number {
    return Hash.string(`${this.x},${this.y}`)
  }
}
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Equal.ts`
- Representative tests: `packages/effect/test/Equal.test.ts`
- Representative tests: `packages/effect/test/Trie.test.ts`
- Representative tests: `packages/effect/test/BigDecimal.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/Cron.test.ts`
- Representative tests: `packages/effect/test/Duration.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
