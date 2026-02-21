# API Reference: effect/unstable/ai/AnthropicStructuredOutput

- Import path: `effect/unstable/ai/AnthropicStructuredOutput`
- Source file: `packages/effect/src/unstable/ai/AnthropicStructuredOutput.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Provides a codec transformation for Anthropic structured output.

## Key Function Exports

- `toCodecAnthropic`

## All Function Signatures

```ts
export declare const toCodecAnthropic: <T, E, RD, RE>(schema: Schema.Codec<T, E, RD, RE>): { readonly codec: Schema.Codec<T, unknown, RD, RE>; readonly jsonSchema: JsonSchema.JsonSchema; };
```

## Other Exports (Non-Function)

- None
