# Usage Reference: effect/SchemaRepresentation

- Import path: `effect/SchemaRepresentation`

## What It Is For

Serializable intermediate representation (IR) of Effect Schema types.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema, SchemaRepresentation } from "effect"

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Int
})

// Schema AST → Document
const doc = SchemaRepresentation.fromAST(Person.ast)

// Document → JSON Schema
const jsonSchema = SchemaRepresentation.toJsonSchemaDocument(doc)

// Document → runtime Schema
const reconstructed = SchemaRepresentation.toSchema(doc)
```

## Test Anchors

- `packages/effect/test/schema/representation/fromASTs.test.ts`
- `packages/effect/test/schema/representation/fromJsonSchemaDocument.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/schema/representation/toJsonSchemaMultiDocument.test.ts`
- `packages/effect/test/schema/representation/toSchema.test.ts`

## Top Symbols In Anchored Tests

- `String` (366)
- `makeCode` (181)
- `Number` (135)
- `Literal` (105)
- `Reference` (89)
- `Filter` (75)
- `TemplateLiteral` (50)
- `sanitizeJavaScriptIdentifier` (43)
- `Unknown` (39)
- `Union` (37)
- `Objects` (33)
- `Boolean` (32)
- `Symbol` (25)
- `Null` (20)
- `Arrays` (19)
