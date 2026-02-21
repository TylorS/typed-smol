# API Reference: effect/unstable/observability/OtlpResource

- Import path: `effect/unstable/observability/OtlpResource`
- Source file: `packages/effect/src/unstable/observability/OtlpResource.ts`
- Function exports (callable): 5
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `entriesToAttributes`
- `fromConfig`
- `make`
- `serviceNameUnsafe`
- `unknownToAttributeValue`

## All Function Signatures

```ts
export declare const entriesToAttributes: (entries: Iterable<[string, unknown]>): Array<KeyValue>;
export declare const fromConfig: (options?: { readonly serviceName?: string | undefined; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown> | undefined; } | undefined): Effect.Effect<Resource>;
export declare const make: (options: { readonly serviceName: string; readonly serviceVersion?: string | undefined; readonly attributes?: Record<string, unknown> | undefined; }): Resource;
export declare const serviceNameUnsafe: (resource: Resource): string;
export declare const unknownToAttributeValue: (value: unknown): AnyValue;
```

## Other Exports (Non-Function)

- `AnyValue` (interface)
- `ArrayValue` (interface)
- `Fixed64` (type)
- `KeyValue` (interface)
- `KeyValueList` (interface)
- `LongBits` (interface)
- `Resource` (interface)
