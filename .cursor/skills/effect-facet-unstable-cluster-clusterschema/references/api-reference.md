# API Reference: effect/unstable/cluster/ClusterSchema

- Import path: `effect/unstable/cluster/ClusterSchema`
- Source file: `packages/effect/src/unstable/cluster/ClusterSchema.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isUninterruptibleForClient`
- `isUninterruptibleForServer`

## All Function Signatures

```ts
export declare const isUninterruptibleForClient: (context: ServiceMap.ServiceMap<never>): boolean;
export declare const isUninterruptibleForServer: (context: ServiceMap.ServiceMap<never>): boolean;
```

## Other Exports (Non-Function)

- `ClientTracingEnabled` (variable)
- `Persisted` (variable)
- `ShardGroup` (variable)
- `Uninterruptible` (variable)
