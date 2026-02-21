# API Reference: effect/unstable/cluster/Singleton

- Import path: `effect/unstable/cluster/Singleton`
- Source file: `packages/effect/src/unstable/cluster/Singleton.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: <E, R>(name: string, run: Effect.Effect<void, E, R>, options?: { readonly shardGroup?: string | undefined; }): Layer.Layer<never, never, Sharding | Exclude<R, Scope>>;
```

## Other Exports (Non-Function)

- None
