# Usage Reference: effect/Equal

- Import path: `effect/Equal`

## What It Is For

This module provides functionality for defining and working with equality between values. It includes the `Equal` interface for types that can determine equality with other values of the same type, and utilities for comparing values.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Equal, Hash } from "effect";

class Coordinate implements Equal.Equal {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  [Equal.symbol](that: Equal.Equal): boolean {
    return that instanceof Coordinate && this.x === that.x && this.y === that.y;
  }

  [Hash.symbol](): number {
    return Hash.string(`${this.x},${this.y}`);
  }
}
```

## Test Anchors

- `packages/effect/test/Equal.test.ts`
- `packages/effect/test/Trie.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/Cron.test.ts`
- `packages/effect/test/Duration.test.ts`

## Top Symbols In Anchored Tests

- `Equal` (287)
- `equals` (248)
- `symbol` (32)
- `byReference` (8)
- `byReferenceUnsafe` (8)
