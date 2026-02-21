---
name: effect-module-jsonschema
description: Guidance for `effect/JsonSchema` focused on APIs like fromSchemaDraft07, fromSchemaDraft2020_12, and fromSchemaOpenApi3_0. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module JsonSchema

## Owned scope

- Owns only `effect/JsonSchema`.
- Source of truth: `packages/effect/src/JsonSchema.ts`.

## What it is for

- Convert JSON Schema documents between dialects (Draft-07, Draft-2020-12, OpenAPI 3.0, OpenAPI 3.1). All dialects are normalized to an internal `Document<"draft-2020-12">` representation before optional conversion to an output dialect.

## API quick reference

- `fromSchemaDraft07`
- `fromSchemaDraft2020_12`
- `fromSchemaOpenApi3_0`
- `fromSchemaOpenApi3_1`
- `Type`
- `Dialect`
- `Document`
- `JsonSchema`
- `Definitions`
- `resolve$ref`
- `MultiDocument`
- `META_SCHEMA_URI_DRAFT_07`
- `META_SCHEMA_URI_DRAFT_2020_12`
- `resolveTopLevel$ref`
- `sanitizeOpenApiComponentsSchemasKey`
- `toDocumentDraft07`
- `toMultiDocumentOpenApi3_1`
- `VALID_OPEN_API_COMPONENTS_SCHEMAS_KEY_REGEXP`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { JsonSchema } from "effect";

const raw: JsonSchema.JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
  },
  required: ["name"],
};

// Parse into canonical form
const doc = JsonSchema.fromSchemaDraft07(raw);

// Convert back to Draft-07
const draft07 = JsonSchema.toDocumentDraft07(doc);

console.log(draft07.dialect); // "draft-07"
console.log(draft07.schema); // { type: "object", properties: { name: { type: "string" } }, required: ["name"] }
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/JsonSchema.ts`
- Representative tests: `packages/effect/test/JsonSchema.test.ts`
- Representative tests: `packages/effect/test/schema/representation/fromJsonSchemaDocument.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/schema/toJsonSchemaDocument.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/OpenAiStructuredOutput.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
