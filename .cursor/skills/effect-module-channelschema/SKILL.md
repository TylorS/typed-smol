---
name: effect-module-channelschema
description: Guidance for `effect/ChannelSchema` focused on APIs like decode, encode, and decodeUnknown. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ChannelSchema

## Owned scope

- Owns only `effect/ChannelSchema`.
- Source of truth: `packages/effect/src/ChannelSchema.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `decode`
- `encode`
- `decodeUnknown`
- `encodeUnknown`
- `duplex`
- `duplexUnknown`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { ChannelSchema } from "effect/ChannelSchema"

const value = ChannelSchema.decode()
const next = ChannelSchema.encode(value)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ChannelSchema.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
