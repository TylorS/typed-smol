# API Reference: effect/unstable/observability/Otlp

- Import path: `effect/unstable/observability/Otlp`
- Source file: `packages/effect/src/unstable/observability/Otlp.ts`
- Function exports (callable): 3
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `layerJson`
- `layerProtobuf`

## All Function Signatures

```ts
export declare const layer: (options: { readonly baseUrl: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly maxBatchSize?: number | undefined; readonly tracerContext?: (<X>(primitive: Tracer.EffectPrimitive<X>, span: Tracer.AnySpan) => X) | undefined; readonly loggerExportInterval?: Duration.Input | undefined; readonly loggerExcludeLogSpans?: boolean | undefined; readonly loggerMergeWithExisting?: boolean | undefined; readonly metricsExportInterval?: Duration.Input | undefined; readonly metricsTemporality?: AggregationTemporality | undefined; readonly tracerExportInterval?: Duration.Input | undefined; readonly shutdownTimeout?: Duration.Input | undefined; }): Layer.Layer<never, never, HttpClient.HttpClient | OtlpSerialization.OtlpSerialization>;
export declare const layerJson: (options: { readonly baseUrl: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly maxBatchSize?: number | undefined; readonly tracerContext?: (<X>(primitive: Tracer.EffectPrimitive<X>, span: Tracer.AnySpan) => X) | undefined; readonly loggerExportInterval?: Duration.Input | undefined; readonly loggerExcludeLogSpans?: boolean | undefined; readonly loggerMergeWithExisting?: boolean | undefined; readonly metricsExportInterval?: Duration.Input | undefined; readonly metricsTemporality?: AggregationTemporality | undefined; readonly tracerExportInterval?: Duration.Input | undefined; readonly shutdownTimeout?: Duration.Input | undefined; }): Layer.Layer<never, never, HttpClient.HttpClient>;
export declare const layerProtobuf: (options: { readonly baseUrl: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly maxBatchSize?: number | undefined; readonly tracerContext?: (<X>(primitive: Tracer.EffectPrimitive<X>, span: Tracer.AnySpan) => X) | undefined; readonly loggerExportInterval?: Duration.Input | undefined; readonly loggerExcludeLogSpans?: boolean | undefined; readonly loggerMergeWithExisting?: boolean | undefined; readonly metricsExportInterval?: Duration.Input | undefined; readonly metricsTemporality?: AggregationTemporality | undefined; readonly tracerExportInterval?: Duration.Input | undefined; readonly shutdownTimeout?: Duration.Input | undefined; }): Layer.Layer<never, never, HttpClient.HttpClient>;
```

## Other Exports (Non-Function)

- None
