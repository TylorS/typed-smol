---
name: effect-facet-scope-state-management
description: Guidance for facet `effect/Scope#state-management` focused on APIs like make, Empty, and provide. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Scope#state-management

## Owned scope

- Owns only `effect/Scope#state-management`.
- Parent module: `effect/Scope`.

## What it is for

- scope state model and transitions. The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

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

- Keep work focused on the `state-management` concern for `effect/Scope`.
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

- Sibling facets under the same parent are out of scope:
  - `effect-facet-scope-creation` (effect/Scope#creation)
  - `effect-facet-scope-finalization` (effect/Scope#finalization)
- Parent module ownership belongs to `effect-module-scope`.

## Escalate to

- `effect-module-scope` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Scope.test.ts`
- Parent tests: `packages/effect/test/Layer.test.ts`
- Parent tests: `packages/effect/test/RcRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
