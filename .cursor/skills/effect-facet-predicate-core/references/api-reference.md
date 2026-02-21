# API Reference: effect/Predicate#core

- Import path: `effect/Predicate#core`
- Source file: `packages/effect/src/Predicate.ts`
- Thematic facet: `core`
- Function exports (callable): 1
- Non-function exports: 3

## Purpose

Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## Key Function Exports

- `isSet`

## All Function Signatures

```ts
export declare const isSet: (input: unknown): input is Set<unknown>;
```

## Other Exports (Non-Function)

- `Predicate` (interface)
- `PredicateTypeLambda` (interface)
- `Refinement` (interface)
