# API Reference: effect/unstable/cluster/ShardingConfig

- Import path: `effect/unstable/cluster/ShardingConfig`
- Source file: `packages/effect/src/unstable/cluster/ShardingConfig.ts`
- Function exports (callable): 2
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `layerFromEnv`

## All Function Signatures

```ts
export declare const layer: (options?: Partial<ShardingConfig["Service"]>): Layer.Layer<ShardingConfig>;
export declare const layerFromEnv: (options?: Partial<ShardingConfig["Service"]> | undefined): Layer.Layer<ShardingConfig, Config.ConfigError>;
```

## Other Exports (Non-Function)

- `config` (variable)
- `configFromEnv` (variable)
- `defaults` (variable)
- `layerDefaults` (variable)
- `ShardingConfig` (class)
