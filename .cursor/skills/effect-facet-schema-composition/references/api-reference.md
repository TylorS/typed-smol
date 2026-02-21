# API Reference: effect/Schema#composition

- Import path: `effect/Schema#composition`
- Source file: `packages/effect/src/Schema.ts`
- Thematic facet: `composition`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `HashMap`
- `ReadonlyMap`

## All Function Signatures

```ts
export declare const HashMap: <Key extends Top, Value extends Top>(key: Key, value: Value): HashMap<Key, Value>;
export declare const ReadonlyMap: <Key extends Top, Value extends Top>(key: Key, value: Value): $ReadonlyMap<Key, Value>;
```

## Other Exports (Non-Function)

- `$ReadonlyMap` (interface)
- `compose` (interface)
- `HashMapIso` (type)
- `ReadonlyMapIso` (type)
