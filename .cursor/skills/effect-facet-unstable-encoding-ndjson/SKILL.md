---
name: effect-facet-unstable-encoding-ndjson
description: Guidance for facet `effect/unstable/encoding/Ndjson` focused on APIs like decode, encode, and decodeSchema. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/encoding/Ndjson

## Owned scope

- Owns only `effect/unstable/encoding/Ndjson`.
- Parent module: `effect/unstable/encoding`.
- Source anchor: `packages/effect/src/unstable/encoding/Ndjson.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `decode`
- `encode`
- `decodeSchema`
- `decodeString`
- `encodeSchema`
- `encodeString`
- `decodeSchemaString`
- `encodeSchemaString`
- `duplex`
- `NdjsonError`
- `duplexSchema`
- `duplexString`
- `duplexSchemaString`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Ndjson } from "effect/unstable/encoding/Ndjson";

const value = Ndjson.decode();
const next = Ndjson.encode(value);
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-encoding-msgpack` (effect/unstable/encoding/Msgpack)
  - `effect-facet-unstable-encoding-sse` (effect/unstable/encoding/Sse)
- Parent module ownership belongs to `effect-module-unstable-encoding`.

## Escalate to

- `effect-module-unstable-encoding` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/encoding/Ndjson.ts`
- Parent tests: `packages/effect/test/unstable/encoding/Sse.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
