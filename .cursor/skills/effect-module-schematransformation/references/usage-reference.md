# Usage Reference: effect/SchemaTransformation

- Import path: `effect/SchemaTransformation`

## What It Is For

Bidirectional transformations for the Effect Schema system.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema, SchemaTransformation } from "effect";

const CentsFromDollars = Schema.Number.pipe(
  Schema.decodeTo(
    Schema.Number,
    SchemaTransformation.transform({
      decode: (dollars) => dollars * 100,
      encode: (cents) => cents / 100,
    }),
  ),
);
```

## Test Anchors

- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`
- `packages/effect/test/schema/toIso.test.ts`

## Top Symbols In Anchored Tests

- `make` (291)
- `passthrough` (21)
- `transform` (13)
- `toLowerCase` (5)
- `toUpperCase` (5)
- `transformOptional` (4)
- `fromJsonString` (3)
- `fromFormData` (2)
- `fromURLSearchParams` (2)
- `transformOrFail` (2)
- `trim` (2)
- `capitalize` (1)
- `snakeToCamel` (1)
- `uncapitalize` (1)
- `urlFromString` (1)
