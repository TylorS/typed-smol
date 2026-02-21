# Usage Reference: effect/Schema#checks

- Import path: `effect/Schema#checks`

## What It Is For

validation/refinement checks. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `checks` concern for `effect/Schema`.
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

- `asserts` (855)
- `check` (89)
- `isMinLength` (15)
- `isGreaterThan` (14)
- `isSchema` (9)
- `isBetween` (8)
- `isInt` (8)
- `NullishOr` (7)
- `isMaxProperties` (6)
- `decodeUnknownPromise` (5)
- `encodeUnknownPromise` (5)
- `isGreaterThanOrEqualTo` (5)
- `isLessThan` (5)
- `isLessThanOrEqualTo` (5)
- `isMinProperties` (4)
