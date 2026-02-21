# API Reference: effect/unstable/ai/OpenAiStructuredOutput

- Import path: `effect/unstable/ai/OpenAiStructuredOutput`
- Source file: `packages/effect/src/unstable/ai/OpenAiStructuredOutput.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Provides codec transformations for OpenAI structured output.

## Key Function Exports

- `toCodecOpenAI`

## All Function Signatures

```ts
export declare const toCodecOpenAI: <T, E, RD, RE>(schema: Schema.Codec<T, E, RD, RE>): { codec: Schema.Codec<T, unknown, RD, RE>; jsonSchema: JsonSchema.JsonSchema; };
```

## Other Exports (Non-Function)

- None
