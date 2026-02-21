---
name: effect-module-unstable-schema
description: Guidance for `effect/unstable/schema` focused on APIs like Model and VariantSchema. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/schema

## Owned scope

- Owns only `effect/unstable/schema`.
- Source of truth: `packages/effect/src/unstable/schema/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Model`
- `VariantSchema`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { schema } from "effect/unstable/schema";

const value = schema.Model();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-schema-model` (effect/unstable/schema/Model)
  - `effect-facet-unstable-schema-variantschema` (effect/unstable/schema/VariantSchema)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-schema-model`.

## Reference anchors

- Module source: `packages/effect/src/unstable/schema/index.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
