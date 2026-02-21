# Usage Reference: effect/SchemaGetter

- Import path: `effect/SchemaGetter`

## What It Is For

Composable transformation primitives for the Effect Schema system.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/schema/SchemaGetter.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`
- `packages/effect/test/schema/toJsonSchemaDocument.test.ts`
- `packages/effect/test/schema/toStandardSchemaV1.test.ts`
- `packages/effect/test/schema/v3-v4.test.ts`

## Top Symbols In Anchored Tests

- `succeed` (1150)
- `String` (629)
- `fail` (591)
- `Number` (219)
- `Date` (164)
- `required` (68)
- `Boolean` (49)
- `passthrough` (31)
- `BigInt` (30)
- `transform` (14)
- `withDefault` (14)
- `omit` (12)
- `transformOptional` (8)
- `toLowerCase` (5)
- `toUpperCase` (5)
