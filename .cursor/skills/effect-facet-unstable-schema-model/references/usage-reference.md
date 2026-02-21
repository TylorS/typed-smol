# Usage Reference: effect/unstable/schema/Model

- Import path: `effect/unstable/schema/Model`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema } from "effect"
import { Model } from "effect/unstable/schema"

export const GroupId = Schema.Number.pipe(Schema.brand("GroupId"))

export class Group extends Model.Class<Group>("Group")({
  id: Model.Generated(GroupId),
  name: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate
}) {}

// schema used for selects
Group

// schema used for inserts
Group.insert

// schema used for updates
Group.update

// schema used for json api
Group.json
Group.jsonCreate
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
