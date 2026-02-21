---
name: effect-facet-scope-creation
description: Guidance for facet `effect/Scope#creation` focused on APIs like make and makeUnsafe. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Scope#creation

## Owned scope

- Owns only `effect/Scope#creation`.
- Parent module: `effect/Scope`.

## What it is for

- scope creation and provisioning. The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## API quick reference

- `make`
- `makeUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `creation` concern for `effect/Scope`.
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
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-scope-finalization` (effect/Scope#finalization)
  - `effect-facet-scope-state-management` (effect/Scope#state-management)
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
