---
name: effect-module-iterable
description: Guidance for `effect/Iterable` focused on APIs like of, map, and empty. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Iterable

## Owned scope

- Owns only `effect/Iterable`.
- Source of truth: `packages/effect/src/Iterable.ts`.

## What it is for

- This module provides utility functions for working with Iterables in TypeScript.

## API quick reference

- `of`
- `map`
- `empty`
- `filter`
- `makeBy`
- `flatMap`
- `getSomes`
- `filterMap`
- `fromRecord`
- `getFailures`
- `getSuccesses`
- `filterMapWhile`
- `flatMapNullishOr`
- `isEmpty`
- `zip`
- `drop`
- `head`
- `scan`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Iterable } from "effect";

// Create iterables
const numbers = Iterable.range(1, 5);
const doubled = Iterable.map(numbers, (x) => x * 2);
const filtered = Iterable.filter(doubled, (x) => x > 5);

console.log(Array.from(filtered)); // [6, 8, 10]

// Infinite iterables
const fibonacci = Iterable.unfold([0, 1], ([a, b]) => [a, [b, a + b]]);
const first10 = Iterable.take(fibonacci, 10);
console.log(Array.from(first10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Iterable.ts`
- Representative tests: `packages/effect/test/Iterable.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
