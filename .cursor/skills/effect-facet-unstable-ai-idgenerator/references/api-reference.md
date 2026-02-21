# API Reference: effect/unstable/ai/IdGenerator

- Import path: `effect/unstable/ai/IdGenerator`
- Source file: `packages/effect/src/unstable/ai/IdGenerator.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

The `IdGenerator` module provides a pluggable system for generating unique identifiers for tool calls and other items in the Effect AI SDKs.

## Key Function Exports

- `layer`
- `make`

## All Function Signatures

```ts
export declare const layer: (options: MakeOptions): Layer.Layer<IdGenerator, Cause.IllegalArgumentError>;
export declare const make: (args_0: MakeOptions): Effect.Effect<{ readonly generateId: () => Effect.Effect<string, never, never>; }, Cause.IllegalArgumentError, never>;
```

## Other Exports (Non-Function)

- `defaultIdGenerator` (variable)
- `IdGenerator` (class)
- `MakeOptions` (interface)
- `Service` (interface)
