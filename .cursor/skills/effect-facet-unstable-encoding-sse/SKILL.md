---
name: effect-facet-unstable-encoding-sse
description: Guidance for facet `effect/unstable/encoding/Sse` focused on APIs like decode, encode, and Parser. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/encoding/Sse

## Owned scope

- Owns only `effect/unstable/encoding/Sse`.
- Parent module: `effect/unstable/encoding`.
- Source anchor: `packages/effect/src/unstable/encoding/Sse.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `decode`
- `encode`
- `Parser`
- `encoder`
- `Encoder`
- `makeParser`
- `decodeSchema`
- `encodeSchema`
- `decodeDataSchema`
- `Event`
- `Retry`
- `AnyEvent`
- `EventEncoded`
- `transformEvent`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Sse } from "effect/unstable/encoding/Sse"

const value = Sse.makeParser()
const next = Sse.decode(value)
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-encoding-msgpack` (effect/unstable/encoding/Msgpack)
  - `effect-facet-unstable-encoding-ndjson` (effect/unstable/encoding/Ndjson)
- Parent module ownership belongs to `effect-module-unstable-encoding`.

## Escalate to

- `effect-module-unstable-encoding` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/encoding/Sse.ts`
- Parent tests: `packages/effect/test/unstable/encoding/Sse.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
