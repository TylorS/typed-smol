# API Reference: effect/unstable/observability/OtlpMetrics

- Import path: `effect/unstable/observability/OtlpMetrics`
- Source file: `packages/effect/src/unstable/observability/OtlpMetrics.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `make`

## All Function Signatures

```ts
export declare const layer: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly shutdownTimeout?: Duration.Input | undefined; readonly temporality?: AggregationTemporality | undefined; }): Layer.Layer<never, never, HttpClient.HttpClient | OtlpSerialization>;
export declare const make: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly shutdownTimeout?: Duration.Input | undefined; readonly temporality?: AggregationTemporality | undefined; }): Effect.Effect<void, never, HttpClient.HttpClient | OtlpSerialization | Scope.Scope>;
```

## Other Exports (Non-Function)

- `AggregationTemporality` (type)
- `MetricsData` (interface)
