# API Reference: effect/unstable/observability/OtlpLogger

- Import path: `effect/unstable/observability/OtlpLogger`
- Source file: `packages/effect/src/unstable/observability/OtlpLogger.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `make`

## All Function Signatures

```ts
export declare const layer: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly maxBatchSize?: number | undefined; readonly shutdownTimeout?: Duration.Input | undefined; readonly excludeLogSpans?: boolean | undefined; readonly mergeWithExisting?: boolean | undefined; }): Layer.Layer<never, never, HttpClient.HttpClient | OtlpSerialization>;
export declare const make: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly maxBatchSize?: number | undefined; readonly shutdownTimeout?: Duration.Input | undefined; readonly excludeLogSpans?: boolean | undefined; }): Effect.Effect<Logger.Logger<unknown, void>, never, OtlpSerialization | HttpClient.HttpClient | Scope.Scope>;
```

## Other Exports (Non-Function)

- `LogsData` (interface)
