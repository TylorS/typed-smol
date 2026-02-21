# API Reference: effect/Random

- Import path: `effect/Random`
- Source file: `packages/effect/src/Random.ts`
- Function exports (callable): 3
- Non-function exports: 4

## Purpose

The Random module provides a service for generating random numbers in Effect programs. It offers a testable and composable way to work with randomness, supporting integers, floating-point numbers, and range-based generation.

## Key Function Exports

- `nextBetween`
- `nextIntBetween`
- `withSeed`

## All Function Signatures

```ts
export declare const nextBetween: (min: number, max: number): Effect.Effect<number>;
export declare const nextIntBetween: (min: number, max: number, options?: { readonly halfOpen?: boolean; }): Effect.Effect<number>;
export declare const withSeed: (seed: string | number): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const withSeed: <A, E, R>(self: Effect.Effect<A, E, R>, seed: string | number): Effect.Effect<A, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `next` (variable)
- `nextInt` (variable)
- `nextUUIDv4` (variable)
- `Random` (variable)
