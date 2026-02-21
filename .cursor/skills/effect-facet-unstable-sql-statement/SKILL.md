---
name: effect-facet-unstable-sql-statement
description: Guidance for facet `effect/unstable/sql/Statement` focused on APIs like make, makeCompiler, and makeCompilerSqlite. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/sql/Statement

## Owned scope

- Owns only `effect/unstable/sql/Statement`.
- Parent module: `effect/unstable/sql`.
- Source anchor: `packages/effect/src/unstable/sql/Statement.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `makeCompiler`
- `makeCompilerSqlite`
- `isCustom`
- `isFragment`
- `or`
- `and`
- `csv`
- `join`
- `custom`
- `Custom`
- `Helper`
- `Dialect`
- `literal`
- `Literal`
- `Segment`
- `Compiler`
- `fragment`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Statement } from "effect/unstable/sql/Statement";

const value = Statement.make();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-sql-migrator` (effect/unstable/sql/Migrator)
  - `effect-facet-unstable-sql-sqlclient` (effect/unstable/sql/SqlClient)
  - `effect-facet-unstable-sql-sqlconnection` (effect/unstable/sql/SqlConnection)
  - `effect-facet-unstable-sql-sqlerror` (effect/unstable/sql/SqlError)
  - `effect-facet-unstable-sql-sqlmodel` (effect/unstable/sql/SqlModel)
  - `effect-facet-unstable-sql-sqlresolver` (effect/unstable/sql/SqlResolver)
  - `effect-facet-unstable-sql-sqlschema` (effect/unstable/sql/SqlSchema)
  - `effect-facet-unstable-sql-sqlstream` (effect/unstable/sql/SqlStream)
- Parent module ownership belongs to `effect-module-unstable-sql`.

## Escalate to

- `effect-module-unstable-sql` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/sql/Statement.ts`
- Parent tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
