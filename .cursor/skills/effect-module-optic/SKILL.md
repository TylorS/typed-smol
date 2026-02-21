---
name: effect-module-optic
description: Guidance for `effect/Optic` focused on APIs like getAll, failure, and makeIso. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Optic

## Owned scope

- Owns only `effect/Optic`.
- Source of truth: `packages/effect/src/Optic.ts`.

## What it is for

- Design: "pretty good" persistency. Real updates copy only the path; unrelated branches keep referential identity. No-op updates may still allocate a new root/parents — callers must not rely on identity for no-ops.

## API quick reference

- `getAll`
- `failure`
- `makeIso`
- `makeLens`
- `makePrism`
- `fromChecks`
- `makeOptional`
- `Iso`
- `id`
- `Lens`
- `none`
- `some`
- `Prism`
- `entries`
- `success`
- `Optional`
- `Traversal`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Optic } from "effect/Optic"

const value = Optic.makeIso()
const next = Optic.getAll(value)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Optic.ts`
- Representative tests: `packages/effect/test/Optic.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
