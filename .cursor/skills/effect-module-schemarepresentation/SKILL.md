---
name: effect-module-schemarepresentation
description: Guidance for `effect/SchemaRepresentation` focused on APIs like Filter, fromAST, and fromASTs. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaRepresentation

## Owned scope

- Owns only `effect/SchemaRepresentation`.
- Source of truth: `packages/effect/src/SchemaRepresentation.ts`.

## What it is for

- Serializable intermediate representation (IR) of Effect Schema types.

## API quick reference

- `Filter`
- `fromAST`
- `fromASTs`
- `makeCode`
- `FilterGroup`
- `fromJsonSchemaDocument`
- `fromJsonSchemaMultiDocument`
- `Any`
- `$Any`
- `Code`
- `Enum`
- `Meta`
- `Null`
- `Void`
- `$Enum`
- `$Null`
- `$Void`
- `Check`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.

## Starter example

```ts
import { Schema, SchemaRepresentation } from "effect";

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Int,
});

// Schema AST → Document
const doc = SchemaRepresentation.fromAST(Person.ast);

// Document → JSON Schema
const jsonSchema = SchemaRepresentation.toJsonSchemaDocument(doc);

// Document → runtime Schema
const reconstructed = SchemaRepresentation.toSchema(doc);
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaRepresentation.ts`
- Representative tests: `packages/effect/test/schema/representation/fromASTs.test.ts`
- Representative tests: `packages/effect/test/schema/representation/fromJsonSchemaDocument.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toJsonSchemaMultiDocument.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
