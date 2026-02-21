---
name: effect-module-hashring
description: Guidance for `effect/HashRing` focused on APIs like get, make, and getShards. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module HashRing

## Owned scope

- Owns only `effect/HashRing`.
- Source of truth: `packages/effect/src/HashRing.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `make`
- `getShards`
- `HashRing`
- `isHashRing`
- `add`
- `has`
- `remove`
- `addMany`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { HashRing } from "effect/HashRing"

const value = HashRing.make()
const next = HashRing.get(value)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/HashRing.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
