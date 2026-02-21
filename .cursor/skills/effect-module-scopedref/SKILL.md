---
name: effect-module-scopedref
description: Guidance for `effect/ScopedRef` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ScopedRef

## Owned scope

- Owns only `effect/ScopedRef`.
- Source of truth: `packages/effect/src/ScopedRef.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `set`
- `make`
- `fromAcquire`
- `getUnsafe`
- `ScopedRef`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { ScopedRef } from "effect/ScopedRef";

const value = ScopedRef.make();
const next = ScopedRef.get(value);
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ScopedRef.ts`
- Representative tests: `packages/effect/test/ScopedRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
