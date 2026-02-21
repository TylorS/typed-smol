# API Reference: effect/unstable/eventlog/SqlEventLogServer

- Import path: `effect/unstable/eventlog/SqlEventLogServer`
- Source file: `packages/effect/src/unstable/eventlog/SqlEventLogServer.ts`
- Function exports (callable): 3
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerStorage`
- `layerStorageSubtle`
- `makeStorage`

## All Function Signatures

```ts
export declare const layerStorage: (options?: { readonly entryTablePrefix?: string; readonly remoteIdTable?: string; readonly insertBatchSize?: number; }): Layer.Layer<EventLogServer.Storage, SqlError.SqlError, SqlClient.SqlClient | EventLogEncryption.EventLogEncryption>;
export declare const layerStorageSubtle: (options?: { readonly entryTablePrefix?: string; readonly remoteIdTable?: string; readonly insertBatchSize?: number; }): Layer.Layer<EventLogServer.Storage, SqlError.SqlError, SqlClient.SqlClient>;
export declare const makeStorage: (options?: { readonly entryTablePrefix?: string; readonly remoteIdTable?: string; readonly insertBatchSize?: number; }): Effect.Effect<EventLogServer.Storage["Service"], SqlError.SqlError, SqlClient.SqlClient | EventLogEncryption.EventLogEncryption | Scope.Scope>;
```

## Other Exports (Non-Function)

- None
