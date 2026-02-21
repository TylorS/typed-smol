# API Reference: effect/unstable/cluster/RunnerHealth

- Import path: `effect/unstable/cluster/RunnerHealth`
- Source file: `packages/effect/src/unstable/cluster/RunnerHealth.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerK8s`
- `makeK8s`

## All Function Signatures

```ts
export declare const layerK8s: (options?: { readonly namespace?: string | undefined; readonly labelSelector?: string | undefined; } | undefined): Layer.Layer<RunnerHealth, never, K8s.K8sHttpClient>;
export declare const makeK8s: (options?: { readonly namespace?: string | undefined; readonly labelSelector?: string | undefined; } | undefined): Effect.Effect<{ readonly isAlive: (address: RunnerAddress) => Effect.Effect<boolean>; }, never, K8s.K8sHttpClient>;
```

## Other Exports (Non-Function)

- `layerNoop` (variable)
- `layerPing` (variable)
- `makePing` (variable)
- `RunnerHealth` (class)
