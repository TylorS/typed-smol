# API Reference: effect/Result#combinators

- Import path: `effect/Result#combinators`
- Source file: `packages/effect/src/Result.ts`
- Thematic facet: `combinators`
- Function exports (callable): 2
- Non-function exports: 10

## Purpose

A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## Key Function Exports

- `andThen`
- `merge`

## All Function Signatures

```ts
export declare const andThen: <A, A2, E2>(f: (a: A) => Result<A2, E2>): <E>(self: Result<A, E>) => Result<A2, E | E2>; // overload 1
export declare const andThen: <A2, E2>(f: Result<A2, E2>): <A, E>(self: Result<A, E>) => Result<A2, E | E2>; // overload 2
export declare const andThen: <A, A2>(f: (a: A) => A2): <E>(self: Result<A, E>) => Result<A2, E>; // overload 3
export declare const andThen: <A2>(right: NotFunction<A2>): <A, E>(self: Result<A, E>) => Result<A2, E>; // overload 4
export declare const andThen: <A, E, A2, E2>(self: Result<A, E>, f: (a: A) => Result<A2, E2>): Result<A2, E | E2>; // overload 5
export declare const andThen: <A, E, A2, E2>(self: Result<A, E>, f: Result<A2, E2>): Result<A2, E | E2>; // overload 6
export declare const andThen: <A, E, A2>(self: Result<A, E>, f: (a: A) => A2): Result<A2, E>; // overload 7
export declare const andThen: <A, E, A2>(self: Result<A, E>, f: NotFunction<A2>): Result<A2, E>; // overload 8
export declare const merge: <A, E>(self: Result<A, E>): E | A;
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
