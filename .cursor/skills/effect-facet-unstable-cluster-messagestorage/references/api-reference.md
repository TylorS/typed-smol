# API Reference: effect/unstable/cluster/MessageStorage

- Import path: `effect/unstable/cluster/MessageStorage`
- Source file: `packages/effect/src/unstable/cluster/MessageStorage.ts`
- Function exports (callable): 2
- Non-function exports: 11

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `makeEncoded`

## All Function Signatures

```ts
export declare const make: (storage: Omit<MessageStorage["Service"], "registerReplyHandler" | "unregisterReplyHandler" | "unregisterShardReplyHandlers">): Effect.Effect<MessageStorage["Service"]>;
export declare const makeEncoded: (encoded: Encoded): Effect.Effect<MessageStorage["Service"], never, Snowflake.Generator>;
```

## Other Exports (Non-Function)

- `Encoded` (type)
- `EncodedRepliesOptions` (type)
- `EncodedUnprocessedOptions` (type)
- `layerMemory` (variable)
- `layerNoop` (variable)
- `MemoryDriver` (class)
- `MemoryEntry` (type)
- `MessageStorage` (class)
- `noop` (variable)
- `SaveResult` (type)
- `SaveResultEncoded` (variable)
