# Usage Reference: effect/Schema#core

- Import path: `effect/Schema#core`

## What It Is For

schema model and constructors. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `core` concern for `effect/Schema`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

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

- `make` (276)
- `FiniteFromString` (108)
- `makeFilter` (17)
- `HashSet` (9)
- `NumberFromString` (9)
- `fromBrand` (4)
- `fromJsonString` (4)
- `ReadonlySet` (3)
- `RedactedFromValue` (3)
- `BooleanFromBit` (2)
- `DateTimeUtcFromMillis` (2)
- `DateTimeUtcFromString` (2)
- `DurationFromMillis` (2)
- `DurationFromNanos` (2)
- `fromFormData` (2)
