# API Reference: effect/unstable/eventlog/EventJournal

- Import path: `effect/unstable/eventlog/EventJournal`
- Source file: `packages/effect/src/unstable/eventlog/EventJournal.ts`
- Function exports (callable): 5
- Non-function exports: 10

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `entryIdMillis`
- `layerIndexedDb`
- `makeEntryIdUnsafe`
- `makeIndexedDb`
- `makeRemoteIdUnsafe`

## All Function Signatures

```ts
export declare const entryIdMillis: (entryId: EntryId): number;
export declare const layerIndexedDb: (options?: { readonly database?: string; }): Layer.Layer<EventJournal, EventJournalError>;
export declare const makeEntryIdUnsafe: (options?: { msecs?: number; }): EntryId;
export declare const makeIndexedDb: (options?: { readonly database?: string; }): Effect.Effect<EventJournal["Service"], EventJournalError, Scope>;
export declare const makeRemoteIdUnsafe: (): RemoteId;
```

## Other Exports (Non-Function)

- `Entry` (class)
- `EntryId` (type)
- `EntryIdTypeId` (type)
- `EventJournal` (class)
- `EventJournalError` (class)
- `layerMemory` (variable)
- `makeMemory` (variable)
- `RemoteEntry` (class)
- `RemoteId` (type)
- `RemoteIdTypeId` (type)
