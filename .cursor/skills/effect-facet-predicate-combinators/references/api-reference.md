# API Reference: effect/Predicate#combinators

- Import path: `effect/Predicate#combinators`
- Source file: `packages/effect/src/Predicate.ts`
- Thematic facet: `combinators`
- Function exports (callable): 1
- Non-function exports: 3

## Purpose

Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## Key Function Exports

- `compose`

## All Function Signatures

```ts
export declare const compose: <A, B extends A, C extends B>(bc: Refinement<B, C>): (ab: Refinement<A, B>) => Refinement<A, C>; // overload 1
export declare const compose: <A, B extends A>(bc: Predicate<NoInfer<B>>): (ab: Refinement<A, B>) => Refinement<A, B>; // overload 2
export declare const compose: <A, B extends A, C extends B>(ab: Refinement<A, B>, bc: Refinement<B, C>): Refinement<A, C>; // overload 3
export declare const compose: <A, B extends A>(ab: Refinement<A, B>, bc: Predicate<NoInfer<B>>): Refinement<A, B>; // overload 4
```

## Other Exports (Non-Function)

- `Predicate` (interface)
- `PredicateTypeLambda` (interface)
- `Refinement` (interface)
