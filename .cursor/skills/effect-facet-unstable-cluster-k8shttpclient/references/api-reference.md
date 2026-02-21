# API Reference: effect/unstable/cluster/K8sHttpClient

- Import path: `effect/unstable/cluster/K8sHttpClient`
- Source file: `packages/effect/src/unstable/cluster/K8sHttpClient.ts`
- Function exports (callable): 1
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `makeGetPods`

## All Function Signatures

```ts
export declare const makeGetPods: (options?: { readonly namespace?: string | undefined; readonly labelSelector?: string | undefined; } | undefined): Effect.Effect<Effect.Effect<Map<string, Pod>, HttpClientError.HttpClientError | Schema.SchemaError, never>, never, K8sHttpClient>;
```

## Other Exports (Non-Function)

- `K8sHttpClient` (class)
- `layer` (variable)
- `makeCreatePod` (variable)
- `Pod` (class)
- `PodStatus` (class)
