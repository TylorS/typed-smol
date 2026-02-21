# Usage Reference: effect/SchemaAST

- Import path: `effect/SchemaAST`

## What It Is For

Abstract Syntax Tree (AST) representation for Effect schemas.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Schema, SchemaAST } from "effect"

const schema = Schema.Struct({ name: Schema.String, age: Schema.Number })
const ast = schema.ast

if (SchemaAST.isObjects(ast)) {
  console.log(ast.propertySignatures.map(ps => ps.name))
  // ["name", "age"]
}

const encoded = SchemaAST.toEncoded(ast)
console.log(SchemaAST.isObjects(encoded)) // true
```

## Test Anchors

- `packages/effect/test/schema/SchemaAST.test.ts`
- `packages/effect/test/schema/Schema.test.ts`

## Top Symbols In Anchored Tests

- `String` (364)
- `Number` (168)
- `string` (125)
- `number` (77)
- `optionalKey` (59)
- `Symbol` (59)
- `Union` (45)
- `Literal` (43)
- `Boolean` (34)
- `TemplateLiteral` (34)
- `getCandidates` (30)
- `annotate` (25)
- `decodeTo` (23)
- `withConstructorDefault` (22)
- `mutableKey` (21)
