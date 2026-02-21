# API Reference: effect/unstable/eventlog/EventLogEncryption

- Import path: `effect/unstable/eventlog/EventLogEncryption`
- Source file: `packages/effect/src/unstable/eventlog/EventLogEncryption.ts`
- Function exports (callable): 1
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `makeEncryptionSubtle`

## All Function Signatures

```ts
export declare const makeEncryptionSubtle: (crypto: Crypto): Effect.Effect<EventLogEncryption["Service"]>;
```

## Other Exports (Non-Function)

- `EncryptedEntry` (variable)
- `EncryptedRemoteEntry` (interface)
- `EventLogEncryption` (class)
- `layerSubtle` (variable)
