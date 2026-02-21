# Usage Reference: effect/HashMap

- Import path: `effect/HashMap`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as HashMap from "effect/HashMap";

// Create a HashMap
const map = HashMap.make(["a", 1], ["b", 2], ["c", 3]);

// Access values
const valueA = HashMap.get(map, "a"); // Option.some(1)
const valueD = HashMap.get(map, "d"); // Option.none()

// Check if key exists
console.log(HashMap.has(map, "b")); // true

// Add/update values (returns new HashMap)
const updated = HashMap.set(map, "d", 4);
console.log(HashMap.size(updated)); // 4
```

## Test Anchors

- `packages/effect/test/HashMap.test.ts`
- `packages/effect/test/Equal.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`
- `packages/effect/test/schema/toEquivalence.test.ts`

## Top Symbols In Anchored Tests

- `make` (366)
- `HashMap` (283)
- `some` (155)
- `map` (120)
- `get` (57)
- `values` (43)
- `has` (36)
- `set` (32)
- `size` (31)
- `keys` (27)
- `entries` (26)
- `empty` (23)
- `filter` (12)
- `union` (9)
- `remove` (8)
