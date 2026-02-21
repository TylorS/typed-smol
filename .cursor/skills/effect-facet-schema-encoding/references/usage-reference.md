# Usage Reference: effect/Schema#encoding

- Import path: `effect/Schema#encoding`

## What It Is For

encode and serialization pathways. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `encoding` concern for `effect/Schema`.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema } from "effect"

// Define custom hook functions for error formatting
const leafHook = (issue: any) => {
  switch (issue._tag) {
    case "InvalidType":
      return "Expected different type"
    case "InvalidValue":
      return "Invalid value provided"
    case "MissingKey":
      return "Required property missing"
    case "UnexpectedKey":
      return "Unexpected property found"
    case "Forbidden":
      return "Operation not allowed"
    case "OneOf":
      return "Multiple valid options available"
    default:
      return "Validation error"
  }
}

// Create a standard schema from a regular schema
const PersonSchema = Schema.Struct({
```

## Test Anchors

- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/JsonPatch.test.ts`
- `packages/effect/test/unstable/encoding/Sse.test.ts`
- `packages/effect/test/unstable/sql/SqlSchema.test.ts`

## Top Symbols In Anchored Tests

- `encode` (32)
- `withConstructorDefault` (22)
- `encodeTo` (14)
- `encodeUnknownPromise` (5)
- `encodeKeys` (2)
- `isGreaterThanOrEqualToBigDecimal` (2)
- `isLessThanOrEqualToBigDecimal` (2)
- `tagDefaultOmit` (2)
- `toTaggedUnion` (2)
- `encodeSync` (1)
- `ToAsserts` (1)
