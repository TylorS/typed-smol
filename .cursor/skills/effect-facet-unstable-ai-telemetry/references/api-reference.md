# API Reference: effect/unstable/ai/Telemetry

- Import path: `effect/unstable/ai/Telemetry`
- Source file: `packages/effect/src/unstable/ai/Telemetry.ts`
- Function exports (callable): 2
- Non-function exports: 15

## Purpose

The `Telemetry` module provides OpenTelemetry integration for operations performed against a large language model provider by defining telemetry attributes and utilities that follow the OpenTelemetry GenAI semantic conventions.

## Key Function Exports

- `addGenAIAnnotations`
- `addSpanAttributes`

## All Function Signatures

```ts
export declare const addGenAIAnnotations: (options: GenAITelemetryAttributeOptions): (span: Span) => void; // overload 1
export declare const addGenAIAnnotations: (span: Span, options: GenAITelemetryAttributeOptions): void; // overload 2
export declare const addSpanAttributes: (keyPrefix: string, transformKey: (key: string) => string): <Attributes extends Record<string, any>>(span: Span, attributes: Attributes) => void;
```

## Other Exports (Non-Function)

- `AllAttributes` (type)
- `AttributesWithPrefix` (type)
- `BaseAttributes` (interface)
- `CurrentSpanTransformer` (class)
- `FormatAttributeName` (type)
- `GenAITelemetryAttributeOptions` (type)
- `GenAITelemetryAttributes` (type)
- `OperationAttributes` (interface)
- `RequestAttributes` (interface)
- `ResponseAttributes` (interface)
- `SpanTransformer` (interface)
- `TokenAttributes` (interface)
- `UsageAttributes` (interface)
- `WellKnownOperationName` (type)
- `WellKnownSystem` (type)
