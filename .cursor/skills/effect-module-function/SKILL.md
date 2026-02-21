---
name: effect-module-function
description: Guidance for `effect/Function` focused on APIs like SK, dual, and flip. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Function

## Owned scope

- Owns only `effect/Function`.
- Source of truth: `packages/effect/src/Function.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

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

- Deep module subsets are owned by these facet skills:
  - `effect-facet-function-composition` (effect/Function#composition)
  - `effect-facet-function-constants` (effect/Function#constants)
  - `effect-facet-function-core` (effect/Function#core)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-function-composition`.

## Reference anchors

- Module source: `packages/effect/src/Function.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Iterable.test.ts`
- Representative tests: `packages/effect/test/PubSub.test.ts`
- Representative tests: `packages/effect/test/Record.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
