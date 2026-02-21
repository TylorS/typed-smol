# API Reference: effect/unstable/cluster/ClusterCron

- Import path: `effect/unstable/cluster/ClusterCron`
- Source file: `packages/effect/src/unstable/cluster/ClusterCron.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: <E, R>(options: { readonly name: string; readonly cron: Cron.Cron; readonly execute: Effect.Effect<void, E, R>; readonly shardGroup?: string | undefined; readonly calculateNextRunFromPrevious?: boolean | undefined; readonly skipIfOlderThan?: Duration.Input | undefined; }): Layer.Layer<never, never, Sharding | Exclude<R, Scope>>;
```

## Other Exports (Non-Function)

- None
