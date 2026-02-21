# API Reference: effect/JsonPatch

- Import path: `effect/JsonPatch`
- Source file: `packages/effect/src/JsonPatch.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

JSON Patch operations for transforming JSON documents.

## Key Function Exports

- `apply`
- `get`

## All Function Signatures

```ts
export declare const apply: (patch: JsonPatch, oldValue: Schema.Json): Schema.Json;
export declare const get: (oldValue: Schema.Json, newValue: Schema.Json): JsonPatch;
```

## Other Exports (Non-Function)

- `JsonPatch` (type)
- `JsonPatchOperation` (type)
