---
name: effect-module-schemagetter
description: Guidance for `effect/SchemaGetter` focused on APIs like fail, Getter, and succeed. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaGetter

## Owned scope

- Owns only `effect/SchemaGetter`.
- Source of truth: `packages/effect/src/SchemaGetter.ts`.

## What it is for

- Composable transformation primitives for the Effect Schema system.

## API quick reference

- `fail`
- `Getter`
- `succeed`
- `decodeHex`
- `encodeHex`
- `parseJson`
- `decodeBase64`
- `encodeBase64`
- `decodeBase64String`
- `decodeBase64Url`
- `decodeBase64UrlString`
- `decodeFormData`
- `decodeHexString`
- `decodeURLSearchParams`
- `encodeBase64Url`
- `encodeFormData`
- `encodeURLSearchParams`
- `makeTreeRecord`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Schema, SchemaGetter } from "effect"

const NumberFromString = Schema.String.pipe(
  Schema.decodeTo(Schema.Number, {
    decode: SchemaGetter.transform((s) => Number(s)),
    encode: SchemaGetter.transform((n) => String(n))
  })
)

const result = Schema.decodeUnknownSync(NumberFromString)("42")
// result: 42
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaGetter.ts`
- Representative tests: `packages/effect/test/schema/SchemaGetter.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- Representative tests: `packages/effect/test/schema/toJsonSchemaDocument.test.ts`
- Representative tests: `packages/effect/test/schema/toStandardSchemaV1.test.ts`
- Representative tests: `packages/effect/test/schema/v3-v4.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
