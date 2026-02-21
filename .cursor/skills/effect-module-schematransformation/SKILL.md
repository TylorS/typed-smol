---
name: effect-module-schematransformation
description: Guidance for `effect/SchemaTransformation` focused on APIs like make, fromFormData, and fromJsonString. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaTransformation

## Owned scope

- Owns only `effect/SchemaTransformation`.
- Source of truth: `packages/effect/src/SchemaTransformation.ts`.

## What it is for

- Bidirectional transformations for the Effect Schema system.

## API quick reference

- `make`
- `fromFormData`
- `fromJsonString`
- `fromURLSearchParams`
- `isTransformation`
- `trim`
- `transform`
- `capitalize`
- `Middleware`
- `passthrough`
- `toLowerCase`
- `toUpperCase`
- `snakeToCamel`
- `uncapitalize`
- `splitKeyValue`
- `urlFromString`
- `bigDecimalFromString`
- `bigintFromString`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Schema, SchemaTransformation } from "effect"

const CentsFromDollars = Schema.Number.pipe(
  Schema.decodeTo(
    Schema.Number,
    SchemaTransformation.transform({
      decode: (dollars) => dollars * 100,
      encode: (cents) => cents / 100
    })
  )
)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaTransformation.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- Representative tests: `packages/effect/test/schema/toIso.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
