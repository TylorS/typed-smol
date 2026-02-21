# Usage Reference: effect/Schema#composition

- Import path: `effect/Schema#composition`

## What It Is For

struct/union/record/tuple composition. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `composition` concern for `effect/Schema`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.

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

- `HashMap` (9)
- `ReadonlyMap` (6)
- `compose` (2)
