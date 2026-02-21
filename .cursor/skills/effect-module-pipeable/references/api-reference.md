# API Reference: effect/Pipeable

- Import path: `effect/Pipeable`
- Source file: `packages/effect/src/Pipeable.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Mixin`
- `pipeArguments`

## All Function Signatures

```ts
export declare const Mixin: <TBase extends new (...args: ReadonlyArray<any>) => any>(klass: TBase): TBase & PipeableConstructor;
export declare const pipeArguments: <A>(self: A, args: IArguments): unknown;
```

## Other Exports (Non-Function)

- `Class` (variable)
- `Pipeable` (interface)
- `PipeableConstructor` (interface)
- `Prototype` (variable)
