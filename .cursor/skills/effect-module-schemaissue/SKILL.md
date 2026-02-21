---
name: effect-module-schemaissue
description: Guidance for `effect/SchemaIssue` focused on APIs like make, Filter, and getActual. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SchemaIssue

## Owned scope

- Owns only `effect/SchemaIssue`.
- Source of truth: `packages/effect/src/SchemaIssue.ts`.

## What it is for

- Structured validation errors produced by the Effect Schema system.

## API quick reference

- `make`
- `Filter`
- `getActual`
- `makeFormatterDefault`
- `makeFormatterStandardSchemaV1`
- `Issue`
- `isIssue`
- `Leaf`
- `AnyOf`
- `OneOf`
- `redact`
- `Pointer`
- `Encoding`
- `LeafHook`
- `CheckHook`
- `Composite`
- `Forbidden`
- `Formatter`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SchemaIssue.ts`
- Representative tests: `packages/effect/test/schema/SchemaIssue.test.ts`
- Representative tests: `packages/effect/test/Config.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/schema/toCodec.test.ts`
- Representative tests: `packages/effect/test/schema/toStandardSchemaV1.test.ts`
- Representative tests: `packages/effect/test/testing/TestSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
