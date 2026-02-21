# API Reference: effect/unstable/ai/Model

- Import path: `effect/unstable/ai/Model`
- Source file: `packages/effect/src/unstable/ai/Model.ts`
- Function exports (callable): 1
- Non-function exports: 2

## Purpose

The `Model` module provides a unified interface for AI service providers.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: <const Provider extends string, Provides, Requires>(provider: Provider, layer: Layer.Layer<Provides, never, Requires>): Model<Provider, Provides, Requires>;
```

## Other Exports (Non-Function)

- `Model` (interface)
- `ProviderName` (class)
