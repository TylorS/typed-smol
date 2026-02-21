---
name: effect-module-schemaparser
description: Guidance for `effect/SchemaParser` focused on APIs like run, Parser, and decodeExit. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaParser

## Owned scope

- Owns only `effect/SchemaParser`.
- Source of truth: `packages/effect/src/SchemaParser.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `run`
- `Parser`
- `decodeExit`
- `decodeSync`
- `encodeExit`
- `encodeSync`
- `makeEffect`
- `decodeEffect`
- `decodeOption`
- `encodeEffect`
- `encodeOption`
- `decodePromise`
- `encodePromise`
- `decodeUnknownEffect`
- `decodeUnknownExit`
- `decodeUnknownOption`
- `decodeUnknownPromise`
- `decodeUnknownSync`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { SchemaParser } from "effect/SchemaParser"

const value = SchemaParser.makeEffect()
const next = SchemaParser.run(value)
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaParser.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
