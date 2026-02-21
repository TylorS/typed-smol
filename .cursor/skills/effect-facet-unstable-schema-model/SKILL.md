---
name: effect-facet-unstable-schema-model
description: Guidance for facet `effect/unstable/schema/Model` focused on APIs like Generated, GeneratedByApp, and Any. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/schema/Model

## Owned scope

- Owns only `effect/unstable/schema/Model`.
- Parent module: `effect/unstable/schema`.
- Source anchor: `packages/effect/src/unstable/schema/Model.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Generated`
- `GeneratedByApp`
- `Any`
- `Date`
- `Group`
- `fields`
- `GroupId`
- `Override`
- `Sensitive`
- `Uint8Array`
- `DateWithNow`
- `FieldOption`
- `UuidV4Insert`
- `VariantsJson`
- `DateTimeFromDateWithNow`
- `DateTimeFromNumberWithNow`
- `DateTimeInsert`
- `DateTimeInsertFromDate`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

export const GroupId = Schema.Number.pipe(Schema.brand("GroupId"));

export class Group extends Model.Class<Group>("Group")({
  id: Model.Generated(GroupId),
  name: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {}

// schema used for selects
Group;

// schema used for inserts
Group.insert;

// schema used for updates
Group.update;

// schema used for json api
Group.json;
Group.jsonCreate;
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-schema-variantschema` (effect/unstable/schema/VariantSchema)
- Parent module ownership belongs to `effect-module-unstable-schema`.

## Escalate to

- `effect-module-unstable-schema` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/schema/Model.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
