---
name: effect-module-hashmap
description: Guidance for `effect/HashMap` focused on APIs like get, map, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module HashMap

## Owned scope

- Owns only `effect/HashMap`.
- Source of truth: `packages/effect/src/HashMap.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `map`
- `set`
- `make`
- `empty`
- `filter`
- `flatMap`
- `getHash`
- `setMany`
- `UpdateFn`
- `filterMap`
- `fromIterable`
- `getUnsafe`
- `hasBy`
- `hasHash`
- `HashMap`
- `isEmpty`
- `isHashMap`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/HashMap.ts`
- Representative tests: `packages/effect/test/HashMap.test.ts`
- Representative tests: `packages/effect/test/Equal.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- Representative tests: `packages/effect/test/schema/toEquivalence.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
