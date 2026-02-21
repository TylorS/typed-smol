# API Reference: effect/unstable/eventlog/SqlEventLogJournal

- Import path: `effect/unstable/eventlog/SqlEventLogJournal`
- Source file: `packages/effect/src/unstable/eventlog/SqlEventLogJournal.ts`
- Function exports (callable): 2
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `make`

## All Function Signatures

```ts
export declare const layer: (options?: { readonly entryTable?: string; readonly remotesTable?: string; }): Layer.Layer<EventJournal.EventJournal, SqlError.SqlError, SqlClient.SqlClient>;
export declare const make: (options?: { readonly entryTable?: string; readonly remotesTable?: string; }): Effect.Effect<EventJournal.EventJournal["Service"], SqlError.SqlError, SqlClient.SqlClient>;
```

## Other Exports (Non-Function)

- None
