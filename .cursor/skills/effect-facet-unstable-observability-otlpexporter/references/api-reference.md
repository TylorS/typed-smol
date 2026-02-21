# API Reference: effect/unstable/observability/OtlpExporter

- Import path: `effect/unstable/observability/OtlpExporter`
- Source file: `packages/effect/src/unstable/observability/OtlpExporter.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: (options: { readonly url: string; readonly headers: Headers.Input | undefined; readonly label: string; readonly exportInterval: Duration.Input; readonly maxBatchSize: number | "disabled"; readonly body: (data: Array<any>) => HttpBody; readonly shutdownTimeout: Duration.Input; }): Effect.Effect<{ readonly push: (data: unknown) => void; }, never, HttpClient.HttpClient | Scope.Scope>;
```

## Other Exports (Non-Function)

- None
