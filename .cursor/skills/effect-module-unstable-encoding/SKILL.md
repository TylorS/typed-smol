---
name: effect-module-unstable-encoding
description: Guidance for `effect/unstable/encoding` focused on APIs like Sse, Ndjson, and Msgpack. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/encoding

## Owned scope

- Owns only `effect/unstable/encoding`.
- Source of truth: `packages/effect/src/unstable/encoding/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Sse`
- `Ndjson`
- `Msgpack`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { encoding } from "effect/unstable/encoding"

const value = encoding.Sse()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-encoding-msgpack` (effect/unstable/encoding/Msgpack)
  - `effect-facet-unstable-encoding-ndjson` (effect/unstable/encoding/Ndjson)
  - `effect-facet-unstable-encoding-sse` (effect/unstable/encoding/Sse)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-encoding-msgpack`.

## Reference anchors

- Module source: `packages/effect/src/unstable/encoding/index.ts`
- Representative tests: `packages/effect/test/unstable/encoding/Sse.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
