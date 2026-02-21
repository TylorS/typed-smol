# API Reference: effect/unstable/ai/Tokenizer

- Import path: `effect/unstable/ai/Tokenizer`
- Source file: `packages/effect/src/unstable/ai/Tokenizer.ts`
- Function exports (callable): 1
- Non-function exports: 2

## Purpose

The `Tokenizer` module provides tokenization and text truncation capabilities for large language model text processing workflows.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: (options: { readonly tokenize: (content: Prompt.Prompt) => Effect.Effect<Array<number>, AiError.AiError>; }): Service;
```

## Other Exports (Non-Function)

- `Service` (interface)
- `Tokenizer` (class)
