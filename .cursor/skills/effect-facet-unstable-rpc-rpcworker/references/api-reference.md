# API Reference: effect/unstable/rpc/RpcWorker

- Import path: `effect/unstable/rpc/RpcWorker`
- Source file: `packages/effect/src/unstable/rpc/RpcWorker.ts`
- Function exports (callable): 3
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `initialMessage`
- `layerInitialMessage`
- `makeInitialMessage`

## All Function Signatures

```ts
export declare const initialMessage: <S extends Schema.Top>(schema: S): Effect.Effect<S["Type"], NoSuchElementError | Schema.SchemaError, Protocol | S["DecodingServices"]>;
export declare const layerInitialMessage: <S extends Schema.Top, R2>(schema: S, build: Effect.Effect<S["Type"], never, R2>): Layer.Layer<InitialMessage, never, S["EncodingServices"] | R2>;
export declare const makeInitialMessage: <S extends Schema.Top, E, R2>(schema: S, effect: Effect.Effect<S["Type"], E, R2>): Effect.Effect<readonly [data: unknown, transferables: ReadonlyArray<globalThis.Transferable>], E | Schema.SchemaError, S["EncodingServices"] | R2>;
```

## Other Exports (Non-Function)

- `InitialMessage` (class)
