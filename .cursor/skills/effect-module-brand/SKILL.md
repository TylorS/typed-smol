---
name: effect-module-brand
description: Guidance for `effect/Brand` focused on APIs like make, FromConstructor, and all. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Brand

## Owned scope

- Owns only `effect/Brand`.
- Source of truth: `packages/effect/src/Brand.ts`.

## What it is for

- This module provides types and utility functions to create and work with branded types, which are TypeScript types with an added type tag to prevent accidental usage of a value in the wrong context.

## API quick reference

- `make`
- `FromConstructor`
- `all`
- `Keys`
- `Brand`
- `check`
- `Brands`
- `Branded`
- `nominal`
- `Unbranded`
- `BrandError`
- `Constructor`
- `EnsureCommonBase`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Brand } from "effect/Brand";

const value = Brand.make();
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Brand.ts`
- Representative tests: `packages/effect/test/Brand.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
