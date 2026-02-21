# API Reference: effect/Tracer

- Import path: `effect/Tracer`
- Source file: `packages/effect/src/Tracer.ts`
- Function exports (callable): 2
- Non-function exports: 18

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `externalSpan`
- `make`

## All Function Signatures

```ts
export declare const externalSpan: (options: { readonly spanId: string; readonly traceId: string; readonly sampled?: boolean | undefined; readonly annotations?: ServiceMap.ServiceMap<never> | undefined; }): ExternalSpan;
export declare const make: (options: Tracer): Tracer;
```

## Other Exports (Non-Function)

- `AnySpan` (type)
- `CurrentTraceLevel` (variable)
- `DisablePropagation` (variable)
- `EffectPrimitive` (interface)
- `ExternalSpan` (interface)
- `MinimumTraceLevel` (variable)
- `NativeSpan` (class)
- `ParentSpan` (class)
- `ParentSpanKey` (variable)
- `Span` (interface)
- `SpanKind` (type)
- `SpanLink` (interface)
- `SpanOptions` (interface)
- `SpanOptionsNoTrace` (interface)
- `SpanStatus` (type)
- `TraceOptions` (interface)
- `Tracer` (interface)
- `TracerKey` (variable)
