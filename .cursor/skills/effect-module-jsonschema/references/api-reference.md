# API Reference: effect/JsonSchema

- Import path: `effect/JsonSchema`
- Source file: `packages/effect/src/JsonSchema.ts`
- Function exports (callable): 9
- Non-function exports: 9

## Purpose

Convert JSON Schema documents between dialects (Draft-07, Draft-2020-12, OpenAPI 3.0, OpenAPI 3.1). All dialects are normalized to an internal `Document<"draft-2020-12">` representation before optional conversion to an output dialect.

## Key Function Exports

- `fromSchemaDraft07`
- `fromSchemaDraft2020_12`
- `fromSchemaOpenApi3_0`
- `fromSchemaOpenApi3_1`
- `resolve$ref`
- `resolveTopLevel$ref`
- `sanitizeOpenApiComponentsSchemasKey`
- `toDocumentDraft07`
- `toMultiDocumentOpenApi3_1`

## All Function Signatures

```ts
export declare const fromSchemaDraft07: (js: JsonSchema): Document<"draft-2020-12">;
export declare const fromSchemaDraft2020_12: (js: JsonSchema): Document<"draft-2020-12">;
export declare const fromSchemaOpenApi3_0: (schema: JsonSchema): Document<"draft-2020-12">;
export declare const fromSchemaOpenApi3_1: (js: JsonSchema): Document<"draft-2020-12">;
export declare const resolve$ref: ($ref: string, definitions: Definitions): JsonSchema | undefined;
export declare const resolveTopLevel$ref: (document: Document<"draft-2020-12">): Document<"draft-2020-12">;
export declare const sanitizeOpenApiComponentsSchemasKey: (s: string): string;
export declare const toDocumentDraft07: (document: Document<"draft-2020-12">): Document<"draft-07">;
export declare const toMultiDocumentOpenApi3_1: (multiDocument: MultiDocument<"draft-2020-12">): MultiDocument<"openapi-3.1">;
```

## Other Exports (Non-Function)

- `Definitions` (interface)
- `Dialect` (type)
- `Document` (interface)
- `JsonSchema` (interface)
- `META_SCHEMA_URI_DRAFT_07` (variable)
- `META_SCHEMA_URI_DRAFT_2020_12` (variable)
- `MultiDocument` (interface)
- `Type` (type)
- `VALID_OPEN_API_COMPONENTS_SCHEMAS_KEY_REGEXP` (variable)
