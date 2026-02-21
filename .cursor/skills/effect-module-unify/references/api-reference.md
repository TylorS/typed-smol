# API Reference: effect/Unify

- Import path: `effect/Unify`
- Source file: `packages/effect/src/Unify.ts`
- Function exports (callable): 1
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `unify`

## All Function Signatures

```ts
export declare const unify: <Args extends Array<any>, Args2 extends Array<any>, Args3 extends Array<any>, Args4 extends Array<any>, Args5 extends Array<any>, T>(x: (...args: Args) => (...args: Args2) => (...args: Args3) => (...args: Args4) => (...args: Args5) => T): (...args: Args) => (...args: Args2) => (...args: Args3) => (...args: Args4) => (...args: Args5) => Unify<T>; // overload 1
export declare const unify: <Args extends Array<any>, Args2 extends Array<any>, Args3 extends Array<any>, Args4 extends Array<any>, T>(x: (...args: Args) => (...args: Args2) => (...args: Args3) => (...args: Args4) => T): (...args: Args) => (...args: Args2) => (...args: Args3) => (...args: Args4) => Unify<T>; // overload 2
export declare const unify: <Args extends Array<any>, Args2 extends Array<any>, Args3 extends Array<any>, T>(x: (...args: Args) => (...args: Args2) => (...args: Args3) => T): (...args: Args) => (...args: Args2) => (...args: Args3) => Unify<T>; // overload 3
export declare const unify: <Args extends Array<any>, Args2 extends Array<any>, T>(x: (...args: Args) => (...args: Args2) => T): (...args: Args) => (...args: Args2) => Unify<T>; // overload 4
export declare const unify: <Args extends Array<any>, T>(x: (...args: Args) => T): (...args: Args) => Unify<T>; // overload 5
export declare const unify: <T>(x: T): Unify<T>; // overload 6
```

## Other Exports (Non-Function)

- `ignoreSymbol` (type)
- `typeSymbol` (type)
- `Unify` (type)
- `unifySymbol` (type)
