---
name: effect-module-types
description: Guidance for `effect/Types` focused on APIs like IsUnion, Has, and Tags. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Types

## Owned scope

- Owns only `effect/Types`.
- Source of truth: `packages/effect/src/Types.ts`.

## What it is for

- Type-level utility types for TypeScript.

## API quick reference

- `IsUnion`
- `Has`
- `Tags`
- `Type`
- `Equals`
- `Mutable`
- `NoInfer`
- `TupleOf`
- `ReasonOf`
- `Simplify`
- `Covariant`
- `Invariant`
- `MergeLeft`
- `unhandled`
- `EqualsWith`
- `ExcludeTag`
- `ExtractTag`
- `MergeRight`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Types } from "effect";

// Exactly 3 numbers
const triple: Types.TupleOf<3, number> = [1, 2, 3];

// @ts-expect-error - too few elements
const tooFew: Types.TupleOf<3, number> = [1, 2];

// @ts-expect-error - too many elements
const tooMany: Types.TupleOf<3, number> = [1, 2, 3, 4];
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Types.ts`
- Representative tests: `packages/effect/test/Pathfinding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
