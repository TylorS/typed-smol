---
name: effect-module-txref
description: Guidance for `effect/TxRef` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxRef

## Owned scope

- Owns only `effect/TxRef`.
- Source of truth: `packages/effect/src/TxRef.ts`.

## What it is for

- TxRef is a transactional value, it can be read and modified within the body of a transaction.

## API quick reference

- `get`
- `set`
- `make`
- `update`
- `makeUnsafe`
- `TxRef`
- `modify`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, TxRef } from "effect";

const program = Effect.gen(function* () {
  // Create a transactional reference
  const ref: TxRef.TxRef<number> = yield* TxRef.make(0);

  // Use within a transaction
  yield* Effect.atomic(
    Effect.gen(function* () {
      const current = yield* TxRef.get(ref);
      yield* TxRef.set(ref, current + 1);
    }),
  );

  const final = yield* TxRef.get(ref);
  console.log(final); // 1
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

- Module source: `packages/effect/src/TxRef.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
