# API Reference: effect/unstable/cluster/SingleRunner

- Import path: `effect/unstable/cluster/SingleRunner`
- Source file: `packages/effect/src/unstable/cluster/SingleRunner.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`

## All Function Signatures

```ts
export declare const layer: (options?: { readonly shardingConfig?: Partial<ShardingConfig.ShardingConfig["Service"]> | undefined; readonly runnerStorage?: "memory" | "sql" | undefined; }): Layer.Layer<Sharding.Sharding | Runners.Runners | MessageStorage.MessageStorage, ConfigError, SqlClient.SqlClient>;
```

## Other Exports (Non-Function)

- None
