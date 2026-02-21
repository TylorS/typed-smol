---
name: effect-facet-unstable-schema-variantschema
description: Guidance for facet `effect/unstable/schema/VariantSchema` focused on APIs like make, isField, and isStruct. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/schema/VariantSchema

## Owned scope

- Owns only `effect/unstable/schema/VariantSchema`.
- Parent module: `effect/unstable/schema`.
- Source anchor: `packages/effect/src/unstable/schema/VariantSchema.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `isField`
- `isStruct`
- `Any`
- `Class`
- `Field`
- `Union`
- `Config`
- `fields`
- `Fields`
- `Struct`
- `TypeId`
- `Extract`
- `Override`
- `Validate`
- `Variants`
- `Overrideable`
- `ExtractFields`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { VariantSchema } from "effect/unstable/schema/VariantSchema";

const value = VariantSchema.make();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-schema-model` (effect/unstable/schema/Model)
- Parent module ownership belongs to `effect-module-unstable-schema`.

## Escalate to

- `effect-module-unstable-schema` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/schema/VariantSchema.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
