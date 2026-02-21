---
name: effect-module-utils
description: Guidance for `effect/Utils` focused on APIs like Gen, GenKind, and makeGenKind. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Utils

## Owned scope

- Owns only `effect/Utils`.
- Source of truth: `packages/effect/src/Utils.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Gen`
- `GenKind`
- `makeGenKind`
- `isGenKind`
- `isGeneratorFunction`
- `Variance`
- `internalCall`
- `SingleShotGen`
- `OptionalNumber`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Utils } from "effect"
import type * as Option from "effect/Option"

// Variance defines the type parameter relationships
declare const variance: Utils.Variance<
  Option.OptionTypeLambda,
  never,
  never,
  never
>
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Utils.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
