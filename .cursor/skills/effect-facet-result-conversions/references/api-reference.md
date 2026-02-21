# API Reference: effect/Result#conversions

- Import path: `effect/Result#conversions`
- Source file: `packages/effect/src/Result.ts`
- Thematic facet: `conversions`
- Function exports (callable): 13
- Non-function exports: 10

## Purpose

A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## Key Function Exports

- `bindTo`
- `fromNullishOr`
- `fromOption`
- `getOrElse`
- `getOrNull`
- `getOrThrow`
- `getOrThrowWith`
- `getOrUndefined`
- `liftPredicate`
- `orElse`
- `transposeMapOption`
- `transposeOption`
- `try`

## All Function Signatures

```ts
export declare const bindTo: <N extends string>(name: N): <R, L>(self: Result<R, L>) => Result<Record<N, R>, L>; // overload 1
export declare const bindTo: <R, L, N extends string>(self: Result<R, L>, name: N): Result<Record<N, R>, L>; // overload 2
export declare const fromNullishOr: <A, E>(onNullish: (a: A) => E): (self: A) => Result<NonNullable<A>, E>; // overload 1
export declare const fromNullishOr: <A, E>(self: A, onNullish: (a: A) => E): Result<NonNullable<A>, E>; // overload 2
export declare const fromOption: <E>(onNone: () => E): <A>(self: Option<A>) => Result<A, E>; // overload 1
export declare const fromOption: <A, E>(self: Option<A>, onNone: () => E): Result<A, E>; // overload 2
export declare const getOrElse: <E, A2>(onFailure: (err: E) => A2): <A>(self: Result<A, E>) => A2 | A; // overload 1
export declare const getOrElse: <A, E, A2>(self: Result<A, E>, onFailure: (err: E) => A2): A | A2; // overload 2
export declare const getOrNull: <A, E>(self: Result<A, E>): A | null;
export declare const getOrThrow: <A, E>(self: Result<A, E>): A;
export declare const getOrThrowWith: <E>(onFailure: (err: E) => unknown): <A>(self: Result<A, E>) => A; // overload 1
export declare const getOrThrowWith: <A, E>(self: Result<A, E>, onFailure: (err: E) => unknown): A; // overload 2
export declare const getOrUndefined: <A, E>(self: Result<A, E>): A | undefined;
export declare const liftPredicate: <A, B extends A, E>(refinement: Refinement<A, B>, orFailWith: (a: A) => E): (a: A) => Result<B, E>; // overload 1
export declare const liftPredicate: <B extends A, E, A = B>(predicate: Predicate<A>, orFailWith: (a: A) => E): (a: B) => Result<B, E>; // overload 2
export declare const liftPredicate: <A, E, B extends A>(self: A, refinement: Refinement<A, B>, orFailWith: (a: A) => E): Result<B, E>; // overload 3
export declare const liftPredicate: <B extends A, E, A = B>(self: B, predicate: Predicate<A>, orFailWith: (a: A) => E): Result<B, E>; // overload 4
export declare const orElse: <E, A2, E2>(that: (err: E) => Result<A2, E2>): <A>(self: Result<A, E>) => Result<A | A2, E2>; // overload 1
export declare const orElse: <A, E, A2, E2>(self: Result<A, E>, that: (err: E) => Result<A2, E2>): Result<A | A2, E2>; // overload 2
export declare const transposeMapOption: <A, B, E = never>(f: (self: A) => Result<B, E>): (self: Option<A>) => Result<Option<B>, E>; // overload 1
export declare const transposeMapOption: <A, B, E = never>(self: Option<A>, f: (self: A) => Result<B, E>): Result<Option<B>, E>; // overload 2
export declare const transposeOption: <A = never, E = never>(self: Option<Result<A, E>>): Result<Option<A>, E>;
export declare const try: <A, E>(options: { readonly try: LazyArg<A>; readonly catch: (error: unknown) => E; }): Result<A, E>; // overload 1
export declare const try: <A>(evaluate: LazyArg<A>): Result<A, unknown>; // overload 2
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
