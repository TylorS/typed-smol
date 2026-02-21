---
name: effect-module-synchronizedref
description: Guidance for `effect/SynchronizedRef` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SynchronizedRef

## Owned scope

- Owns only `effect/SynchronizedRef`.
- Source of truth: `packages/effect/src/SynchronizedRef.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

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
- `updateEffect`
- `getAndUpdateEffect`
- `getAndUpdateSome`
- `getAndUpdateSomeEffect`
- `updateAndGetEffect`
- `updateSomeAndGet`
- `updateSomeAndGetEffect`
- `updateSomeEffect`
- `getUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { SynchronizedRef } from "effect/SynchronizedRef"

const value = SynchronizedRef.make()
const next = SynchronizedRef.get(value)
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SynchronizedRef.ts`
- Representative tests: `packages/effect/test/SynchronizedRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
