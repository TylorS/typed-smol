# API Reference: effect/unstable/ai/Chat

- Import path: `effect/unstable/ai/Chat`
- Source file: `packages/effect/src/unstable/ai/Chat.ts`
- Function exports (callable): 5
- Non-function exports: 6

## Purpose

The `Chat` module provides a stateful conversation interface for AI language models.

## Key Function Exports

- `fromExport`
- `fromJson`
- `fromPrompt`
- `layerPersisted`
- `makePersisted`

## All Function Signatures

```ts
export declare const fromExport: (data: unknown): Effect.Effect<Service, Schema.SchemaError, LanguageModel.LanguageModel>;
export declare const fromJson: (data: string): Effect.Effect<Service, Schema.SchemaError, LanguageModel.LanguageModel>;
export declare const fromPrompt: (prompt: Prompt.RawInput): Effect.Effect<Service, never, never>;
export declare const layerPersisted: (options: { readonly storeId: string; }): Layer.Layer<Persistence, never, BackingPersistence>;
export declare const makePersisted: (options: { readonly storeId: string; }): Effect.Effect<Persistence.Service, never, Scope | BackingPersistence>;
```

## Other Exports (Non-Function)

- `Chat` (class)
- `ChatNotFoundError` (class)
- `empty` (variable)
- `Persisted` (interface)
- `Persistence` (class)
- `Service` (interface)
