# API Reference: effect/unstable/observability/PrometheusMetrics

- Import path: `effect/unstable/observability/PrometheusMetrics`
- Source file: `packages/effect/src/unstable/observability/PrometheusMetrics.ts`
- Function exports (callable): 3
- Non-function exports: 3

## Purpose

Prometheus metrics exporter for Effect's Metric system.

## Key Function Exports

- `format`
- `formatUnsafe`
- `layerHttp`

## All Function Signatures

```ts
export declare const format: (options?: FormatOptions | undefined): Effect.Effect<string>;
export declare const formatUnsafe: (services: ServiceMap.ServiceMap<never>, options?: FormatOptions | undefined): string;
export declare const layerHttp: (options?: HttpOptions | undefined): Layer.Layer<never, never, HttpRouter.HttpRouter>;
```

## Other Exports (Non-Function)

- `FormatOptions` (interface)
- `HttpOptions` (interface)
- `MetricNameMapper` (type)
