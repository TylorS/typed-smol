# Usage Reference: effect/SchemaIssue

- Import path: `effect/SchemaIssue`

## What It Is For

Structured validation errors produced by the Effect Schema system.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema, SchemaIssue } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

try {
  Schema.decodeUnknownSync(Person)({ name: 42 });
} catch (e) {
  if (Schema.isSchemaError(e)) {
    console.log(SchemaIssue.isIssue(e.issue));
    // true
    console.log(String(e.issue));
    // formatted error message
  }
}
```

## Test Anchors

- `packages/effect/test/schema/SchemaIssue.test.ts`
- `packages/effect/test/Config.test.ts`
- `packages/effect/test/schema/Schema.test.ts`
- `packages/effect/test/schema/toCodec.test.ts`
- `packages/effect/test/schema/toStandardSchemaV1.test.ts`
- `packages/effect/test/testing/TestSchema.test.ts`

## Top Symbols In Anchored Tests

- `make` (294)
- `InvalidValue` (7)
- `Issue` (6)
- `Forbidden` (5)
- `defaultLeafHook` (3)
- `InvalidType` (2)
- `isIssue` (2)
- `Encoding` (1)
- `makeFormatterStandardSchemaV1` (1)
- `MissingKey` (1)
