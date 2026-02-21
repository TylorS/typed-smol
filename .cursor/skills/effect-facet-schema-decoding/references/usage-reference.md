# Usage Reference: effect/Schema#decoding

- Import path: `effect/Schema#decoding`

## What It Is For

decode and parse pathways. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `decoding` concern for `effect/Schema`.
- Start with constructor-style APIs to build values/services before composing operations.
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

- `FiniteFromString` (108)
- `decode` (32)
- `decodeTo` (23)
- `TemplateLiteralParser` (14)
- `NumberFromString` (9)
- `decodeUnknownPromise` (5)
- `decodeUnknownExit` (4)
- `decodeUnknownSync` (4)
- `fromBrand` (4)
- `fromJsonString` (4)
- `RedactedFromValue` (3)
- `BooleanFromBit` (2)
- `DateTimeUtcFromMillis` (2)
- `DateTimeUtcFromString` (2)
- `DurationFromMillis` (2)
