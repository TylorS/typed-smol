# API Reference: effect/Utils

- Import path: `effect/Utils`
- Source file: `packages/effect/src/Utils.ts`
- Function exports (callable): 4
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `internalCall`
- `isGeneratorFunction`
- `isGenKind`
- `makeGenKind`

## All Function Signatures

```ts
export declare const internalCall: <A>(body: () => A): A;
export declare const isGeneratorFunction: (u: unknown): u is (...args: Array<any>) => Generator<any, any, any>;
export declare const isGenKind: (u: unknown): u is GenKind<any, any, any, any, any>;
export declare const makeGenKind: <F extends TypeLambda, R, O, E, A>(kind: Kind<F, R, O, E, A>): GenKind<F, R, O, E, A>;
```

## Other Exports (Non-Function)

- `Gen` (type)
- `GenKind` (interface)
- `OptionalNumber` (type)
- `SingleShotGen` (class)
- `Variance` (interface)
