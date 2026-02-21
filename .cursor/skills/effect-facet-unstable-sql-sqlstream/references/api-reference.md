# API Reference: effect/unstable/sql/SqlStream

- Import path: `effect/unstable/sql/SqlStream`
- Source file: `packages/effect/src/unstable/sql/SqlStream.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `asyncPauseResume`

## All Function Signatures

```ts
export declare const asyncPauseResume: <A, E = never, R = never>(register: (emit: { readonly single: (item: A) => void; readonly array: (arr: ReadonlyArray<A>) => void; readonly fail: (error: E) => void; readonly end: () => void; }) => Effect.Effect<{ onPause(): void; onResume(): void; }, E, R | Scope.Scope>, bufferSize?: number): Stream.Stream<A, E, R>;
```

## Other Exports (Non-Function)

- None
