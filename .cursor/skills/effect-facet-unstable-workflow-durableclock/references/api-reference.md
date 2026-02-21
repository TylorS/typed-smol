# API Reference: effect/unstable/workflow/DurableClock

- Import path: `effect/unstable/workflow/DurableClock`
- Source file: `packages/effect/src/unstable/workflow/DurableClock.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `sleep`

## All Function Signatures

```ts
export declare const make: (options: { readonly name: string; readonly duration: Duration.Input; }): DurableClock;
export declare const sleep: (options: { readonly name: string; readonly duration: Duration.Input; readonly inMemoryThreshold?: Duration.Input | undefined; }): Effect.Effect<void, never, WorkflowEngine | WorkflowInstance>;
```

## Other Exports (Non-Function)

- `DurableClock` (interface)
