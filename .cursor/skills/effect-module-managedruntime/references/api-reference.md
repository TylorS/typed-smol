# API Reference: effect/ManagedRuntime

- Import path: `effect/ManagedRuntime`
- Source file: `packages/effect/src/ManagedRuntime.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isManagedRuntime`
- `make`

## All Function Signatures

```ts
export declare const isManagedRuntime: (input: unknown): input is ManagedRuntime<unknown, unknown>;
export declare const make: <R, ER>(layer: Layer.Layer<R, ER, never>, options?: { readonly memoMap?: Layer.MemoMap | undefined; } | undefined): ManagedRuntime<R, ER>;
```

## Other Exports (Non-Function)

- `ManagedRuntime` (interface)
