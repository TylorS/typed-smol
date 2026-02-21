# API Reference: effect/unstable/http/HttpTraceContext

- Import path: `effect/unstable/http/HttpTraceContext`
- Source file: `packages/effect/src/unstable/http/HttpTraceContext.ts`
- Function exports (callable): 5
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `b3`
- `fromHeaders`
- `toHeaders`
- `w3c`
- `xb3`

## All Function Signatures

```ts
export declare const b3: (headers: Headers.Headers): Tracer.ExternalSpan | undefined;
export declare const fromHeaders: (headers: Headers.Headers): Tracer.ExternalSpan | undefined;
export declare const toHeaders: (span: Tracer.Span): Headers.Headers;
export declare const w3c: (headers: Headers.Headers): Tracer.ExternalSpan | undefined;
export declare const xb3: (headers: Headers.Headers): Tracer.ExternalSpan | undefined;
```

## Other Exports (Non-Function)

- `FromHeaders` (interface)
