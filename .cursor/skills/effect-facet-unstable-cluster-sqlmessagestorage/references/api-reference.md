# API Reference: effect/unstable/cluster/SqlMessageStorage

- Import path: `effect/unstable/cluster/SqlMessageStorage`
- Source file: `packages/effect/src/unstable/cluster/SqlMessageStorage.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerWith`
- `make`

## All Function Signatures

```ts
export declare const layerWith: (options: { readonly prefix?: string | undefined; }): Layer.Layer<MessageStorage.MessageStorage, never, SqlClient.SqlClient | ShardingConfig>;
export declare const make: (options?: { readonly prefix?: string | undefined; }): Effect.Effect<MessageStorage.MessageStorage["Service"], never, SqlClient.SqlClient | Snowflake.Generator>;
```

## Other Exports (Non-Function)

- `layer` (variable)
