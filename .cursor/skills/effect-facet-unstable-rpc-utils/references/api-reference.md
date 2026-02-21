# API Reference: effect/unstable/rpc/Utils

- Import path: `effect/unstable/rpc/Utils`
- Source file: `packages/effect/src/unstable/rpc/Utils.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `withRun`

## All Function Signatures

```ts
export declare const withRun: <A extends { readonly run: (f: (...args: Array<any>) => Effect.Effect<void>) => Effect.Effect<never>; }>(): <EX, RX>(f: (write: Parameters<A["run"]>[0]) => Effect.Effect<Omit<A, "run">, EX, RX>) => Effect.Effect<A, EX, RX>;
```

## Other Exports (Non-Function)

- None
