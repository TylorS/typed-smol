---
name: effect-module-schemaast
description: Guidance for `effect/SchemaAST` focused on APIs like Filter, getAST, and decodeTo. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaAST

## Owned scope

- Owns only `effect/SchemaAST`.
- Source of truth: `packages/effect/src/SchemaAST.ts`.

## What it is for

- Abstract Syntax Tree (AST) representation for Effect schemas.

## API quick reference

- `Filter`
- `getAST`
- `decodeTo`
- `mapOrSame`
- `runChecks`
- `makeFilter`
- `FilterGroup`
- `ParseOptions`
- `getCandidates`
- `getIndexSignatureKeys`
- `getTemplateLiteralRegExp`
- `makeFilterByGuard`
- `isAny`
- `isAST`
- `isEnum`
- `isNull`
- `isVoid`
- `isNever`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaAST.ts`
- Representative tests: `packages/effect/test/schema/SchemaAST.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
