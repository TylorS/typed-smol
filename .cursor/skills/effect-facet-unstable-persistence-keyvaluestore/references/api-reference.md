# API Reference: effect/unstable/persistence/KeyValueStore

- Import path: `effect/unstable/persistence/KeyValueStore`
- Source file: `packages/effect/src/unstable/persistence/KeyValueStore.ts`
- Function exports (callable): 6
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerFileSystem`
- `layerStorage`
- `make`
- `makeStringOnly`
- `prefix`
- `toSchemaStore`

## All Function Signatures

```ts
export declare const layerFileSystem: (directory: string): Layer.Layer<KeyValueStore, PlatformError, FileSystem.FileSystem | Path.Path>;
export declare const layerStorage: (evaluate: LazyArg<Storage>): Layer.Layer<KeyValueStore>;
export declare const make: (options: MakeOptions): KeyValueStore;
export declare const makeStringOnly: (options: MakeStringOptions): KeyValueStore;
export declare const prefix: (prefix: string): (self: KeyValueStore) => KeyValueStore; // overload 1
export declare const prefix: (self: KeyValueStore, prefix: string): KeyValueStore; // overload 2
export declare const toSchemaStore: <S extends Schema.Top>(self: KeyValueStore, schema: S): SchemaStore<S>;
```

## Other Exports (Non-Function)

- `KeyValueStore` (interface)
- `KeyValueStoreError` (class)
- `layerMemory` (variable)
- `MakeOptions` (type)
- `MakeStringOptions` (type)
- `SchemaStore` (interface)
