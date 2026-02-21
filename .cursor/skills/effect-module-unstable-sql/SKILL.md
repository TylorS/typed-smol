---
name: effect-module-unstable-sql
description: Guidance for `effect/unstable/sql` focused on APIs like Migrator, SqlError, and SqlModel. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/sql

## Owned scope

- Owns only `effect/unstable/sql`.
- Source of truth: `packages/effect/src/unstable/sql/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Migrator`
- `SqlError`
- `SqlModel`
- `SqlClient`
- `SqlSchema`
- `SqlStream`
- `Statement`
- `SqlResolver`
- `SqlConnection`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { sql } from "effect/unstable/sql"

const value = sql.Migrator()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-sql-migrator` (effect/unstable/sql/Migrator)
  - `effect-facet-unstable-sql-sqlclient` (effect/unstable/sql/SqlClient)
  - `effect-facet-unstable-sql-sqlconnection` (effect/unstable/sql/SqlConnection)
  - `effect-facet-unstable-sql-sqlerror` (effect/unstable/sql/SqlError)
  - `effect-facet-unstable-sql-sqlmodel` (effect/unstable/sql/SqlModel)
  - `effect-facet-unstable-sql-sqlresolver` (effect/unstable/sql/SqlResolver)
  - `effect-facet-unstable-sql-sqlschema` (effect/unstable/sql/SqlSchema)
  - `effect-facet-unstable-sql-sqlstream` (effect/unstable/sql/SqlStream)
  - `effect-facet-unstable-sql-statement` (effect/unstable/sql/Statement)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-sql-migrator`.

## Reference anchors

- Module source: `packages/effect/src/unstable/sql/index.ts`
- Representative tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
