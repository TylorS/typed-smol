---
name: effect-module-schemautils
description: Guidance for `effect/SchemaUtils` focused on APIs like getNativeClassSchema. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaUtils

## Owned scope

- Owns only `effect/SchemaUtils`.
- Source of truth: `packages/effect/src/SchemaUtils.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `getNativeClassSchema`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { SchemaUtils } from "effect/SchemaUtils";

const value = SchemaUtils.getNativeClassSchema();
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaUtils.ts`
- Representative tests: `packages/effect/test/schema/toIso.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
