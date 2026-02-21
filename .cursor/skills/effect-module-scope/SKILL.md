---
name: effect-module-scope
description: Guidance for `effect/Scope` focused on APIs like make, Empty, and provide. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Scope

## Owned scope

- Owns only `effect/Scope`.
- Source of truth: `packages/effect/src/Scope.ts`.

## What it is for

- The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## API quick reference

- `make`
- `Empty`
- `provide`
- `makeUnsafe`
- `use`
- `fork`
- `Open`
- `close`
- `Scope`
- `Closed`
- `Closeable`
- `addFinalizer`
- `addFinalizerExit`
- `forkUnsafe`
- `closeUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Exit, Scope } from "effect";

const program = Effect.gen(function* () {
  const scope = yield* Scope.make("sequential");

  // Scope has a strategy and state
  console.log(scope.strategy); // "sequential"
  console.log(scope.state._tag); // "Open"

  // Close the scope
  yield* Scope.close(scope, Exit.void);
  console.log(scope.state._tag); // "Closed"
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-scope-creation` (effect/Scope#creation)
  - `effect-facet-scope-finalization` (effect/Scope#finalization)
  - `effect-facet-scope-state-management` (effect/Scope#state-management)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-scope-creation`.

## Reference anchors

- Module source: `packages/effect/src/Scope.ts`
- Representative tests: `packages/effect/test/Scope.test.ts`
- Representative tests: `packages/effect/test/Layer.test.ts`
- Representative tests: `packages/effect/test/RcRef.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/FiberMap.test.ts`
- Representative tests: `packages/effect/test/FiberSet.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
