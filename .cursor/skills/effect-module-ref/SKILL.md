---
name: effect-module-ref
description: Guidance for `effect/Ref` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Ref

## Owned scope

- Owns only `effect/Ref`.
- Source of truth: `packages/effect/src/Ref.ts`.

## What it is for

- This module provides utilities for working with mutable references in a functional context.

## API quick reference

- `get`
- `set`
- `make`
- `update`
- `getAndSet`
- `setAndGet`
- `updateSome`
- `getAndUpdate`
- `updateAndGet`
- `getAndUpdateSome`
- `updateSomeAndGet`
- `getUnsafe`
- `makeUnsafe`
- `Ref`
- `modify`
- `Variance`
- `modifySome`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Ref } from "effect";

const program = Effect.gen(function* () {
  // Create a ref with initial value
  const counter = yield* Ref.make(0);

  // Atomic operations
  yield* Ref.update(counter, (n) => n + 1);
  yield* Ref.update(counter, (n) => n * 2);

  const value = yield* Ref.get(counter);
  console.log(value); // 2

  // Atomic modify with return value
  const previous = yield* Ref.getAndSet(counter, 100);
  console.log(previous); // 2
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Ref.ts`
- Representative tests: `packages/effect/test/Ref.test.ts`
- Representative tests: `packages/effect/test/Resource.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/FiberHandle.test.ts`
- Representative tests: `packages/effect/test/FiberMap.test.ts`
- Representative tests: `packages/effect/test/FiberSet.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
