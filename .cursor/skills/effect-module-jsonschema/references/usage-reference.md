# Usage Reference: effect/JsonSchema

- Import path: `effect/JsonSchema`

## What It Is For

Convert JSON Schema documents between dialects (Draft-07, Draft-2020-12, OpenAPI 3.0, OpenAPI 3.1). All dialects are normalized to an internal `Document<"draft-2020-12">` representation before optional conversion to an output dialect.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/JsonSchema.test.ts`
- `packages/effect/test/schema/representation/fromJsonSchemaDocument.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- `packages/effect/test/schema/toJsonSchemaDocument.test.ts`
- `packages/effect/test/unstable/ai/AnthropicStructuredOutput.test.ts`
- `packages/effect/test/unstable/ai/OpenAiStructuredOutput.test.ts`

## Top Symbols In Anchored Tests

- `JsonSchema` (166)
- `fromSchemaOpenApi3_0` (21)
- `fromSchemaDraft07` (14)
- `fromSchemaDraft2020_12` (7)
- `toDocumentDraft07` (6)
- `Document` (5)
- `fromSchemaOpenApi3_1` (5)
- `MultiDocument` (3)
- `Definitions` (2)
- `toMultiDocumentOpenApi3_1` (2)
- `META_SCHEMA_URI_DRAFT_2020_12` (1)
- `sanitizeOpenApiComponentsSchemasKey` (1)
