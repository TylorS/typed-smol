# Usage Reference: effect/Schema

- Import path: `effect/Schema`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
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
- `packages/effect/test/Brand.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `asserts` (855)
- `FiniteFromString` (108)
- `check` (98)
- `Int` (76)
- `is` (40)
- `Literal` (36)
- `Boolean` (34)
- `BigDecimal` (33)
- `decode` (32)
- `encode` (32)
- `Error` (28)
- `annotate` (26)
- `Json` (25)
- `Cause` (24)
- `Duration` (24)
