# API Reference: effect/Result#core

- Import path: `effect/Result#core`
- Source file: `packages/effect/src/Result.ts`
- Thematic facet: `core`
- Function exports (callable): 10
- Non-function exports: 10

## Purpose

A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## Key Function Exports

- `fromNullishOr`
- `fromOption`
- `getFailure`
- `getOrElse`
- `getOrNull`
- `getOrThrow`
- `getOrThrowWith`
- `getOrUndefined`
- `getSuccess`
- `makeEquivalence`

## All Function Signatures

```ts
export declare const fromNullishOr: <A, E>(onNullish: (a: A) => E): (self: A) => Result<NonNullable<A>, E>; // overload 1
export declare const fromNullishOr: <A, E>(self: A, onNullish: (a: A) => E): Result<NonNullable<A>, E>; // overload 2
export declare const fromOption: <E>(onNone: () => E): <A>(self: Option<A>) => Result<A, E>; // overload 1
export declare const fromOption: <A, E>(self: Option<A>, onNone: () => E): Result<A, E>; // overload 2
export declare const getFailure: <A, E>(self: Result<A, E>): Option<E>;
export declare const getOrElse: <E, A2>(onFailure: (err: E) => A2): <A>(self: Result<A, E>) => A2 | A; // overload 1
export declare const getOrElse: <A, E, A2>(self: Result<A, E>, onFailure: (err: E) => A2): A | A2; // overload 2
export declare const getOrNull: <A, E>(self: Result<A, E>): A | null;
export declare const getOrThrow: <A, E>(self: Result<A, E>): A;
export declare const getOrThrowWith: <E>(onFailure: (err: E) => unknown): <A>(self: Result<A, E>) => A; // overload 1
export declare const getOrThrowWith: <A, E>(self: Result<A, E>, onFailure: (err: E) => unknown): A; // overload 2
export declare const getOrUndefined: <A, E>(self: Result<A, E>): A | undefined;
export declare const getSuccess: <A, E>(self: Result<A, E>): Option<A>;
export declare const makeEquivalence: <A, E>(success: Equivalence.Equivalence<A>, failure: Equivalence.Equivalence<E>): Equivalence.Equivalence<Result<A, E>>;
```

## Other Exports (Non-Function)

- `Do` (variable)
- `Failure` (interface)
- `failVoid` (variable)
- `Result` (type)
- `ResultTypeLambda` (interface)
- `ResultUnify` (interface)
- `ResultUnifyIgnore` (interface)
- `succeedNone` (variable)
- `Success` (interface)
- `void` (variable)
