# API Reference: effect/unstable/observability/OtlpTracer

- Import path: `effect/unstable/observability/OtlpTracer`
- Source file: `packages/effect/src/unstable/observability/OtlpTracer.ts`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `make`

## All Function Signatures

```ts
export declare const layer: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly maxBatchSize?: number | undefined; readonly context?: (<X>(primitive: Tracer.EffectPrimitive<X>, span: Tracer.AnySpan) => X) | undefined; readonly shutdownTimeout?: Duration.Input | undefined; }): Layer.Layer<never, never, OtlpSerialization | HttpClient.HttpClient>;
export declare const make: (options: { readonly url: string; readonly resource?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown>; } | undefined; readonly headers?: Headers.Input | undefined; readonly exportInterval?: Duration.Input | undefined; readonly maxBatchSize?: number | undefined; readonly context?: (<X>(primitive: Tracer.EffectPrimitive<X>, span: Tracer.AnySpan) => X) | undefined; readonly shutdownTimeout?: Duration.Input | undefined; }): Effect.Effect<Tracer.Tracer, never, OtlpSerialization | HttpClient.HttpClient | Scope.Scope>;
```

## Other Exports (Non-Function)

- `ResourceSpan` (interface)
- `ScopeSpan` (interface)
- `TraceData` (interface)
