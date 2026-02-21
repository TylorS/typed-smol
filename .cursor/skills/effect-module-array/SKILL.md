---
name: effect-module-array
description: Guidance for `effect/Array` focused on APIs like of, get, and map. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Array

## Owned scope

- Owns only `effect/Array`.
- Source of truth: `packages/effect/src/Array.ts`.

## What it is for

- Utilities for working with immutable arrays (and non-empty arrays) in a functional style. All functions treat arrays as immutable — they return new arrays rather than mutating the input.

## API quick reference

- `of`
- `get`
- `map`
- `make`
- `empty`
- `filter`
- `makeBy`
- `flatMap`
- `getSomes`
- `mapAccum`
- `makeOrder`
- `fromOption`
- `fromRecord`
- `getFailures`
- `fromIterable`
- `getSuccesses`
- `fromNullishOr`
- `flatMapNullishOr`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Array } from "effect"

const numbers = Array.make(1, 2, 3, 4, 5)

const doubled = Array.map(numbers, (n) => n * 2)
console.log(doubled) // [2, 4, 6, 8, 10]

const evens = Array.filter(numbers, (n) => n % 2 === 0)
console.log(evens) // [2, 4]

const sum = Array.reduce(numbers, 0, (acc, n) => acc + n)
console.log(sum) // 15
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Array.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- Representative tests: `packages/effect/test/ExecutionPlan.test.ts`
- Representative tests: `packages/effect/test/FiberMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
