---
name: effect-facet-function-constants
description: Guidance for facet `effect/Function#constants` focused on APIs like SK, dual, and flip. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Function#constants

## Owned scope

- Owns only `effect/Function#constants`.
- Parent module: `effect/Function`.

## What it is for

- constant helper functions. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `SK`
- `dual`
- `flip`
- `flow`
- `hole`
- `pipe`
- `apply`
- `absurd`
- `tupled`
- `compose`
- `LazyArg`
- `memoize`
- `constant`
- `identity`
- `untupled`
- `constNull`
- `constTrue`
- `constVoid`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `constants` concern for `effect/Function`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { FunctionTypeLambda } from "effect/Function"
import type { Kind } from "effect/HKT"

// Create a function type using the type lambda
type StringToNumber = Kind<FunctionTypeLambda, string, never, never, number>
// Equivalent to: (a: string) => number
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-function-composition` (effect/Function#composition)
  - `effect-facet-function-core` (effect/Function#core)
- Parent module ownership belongs to `effect-module-function`.

## Escalate to

- `effect-module-function` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Array.test.ts`
- Parent tests: `packages/effect/test/Chunk.test.ts`
- Parent tests: `packages/effect/test/Effect.test.ts`
- Parent tests: `packages/effect/test/Iterable.test.ts`
- Parent tests: `packages/effect/test/PubSub.test.ts`
- Parent tests: `packages/effect/test/Record.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
