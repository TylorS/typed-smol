# API Reference: effect/Effect#constructors

- Import path: `effect/Effect#constructors`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `constructors`
- Function exports (callable): 12
- Non-function exports: 1

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `fail`
- `failCause`
- `failCauseSync`
- `failSync`
- `fromNullishOr`
- `fromOption`
- `fromResult`
- `fromYieldable`
- `makeSpan`
- `makeSpanScoped`
- `succeed`
- `succeedSome`

## All Function Signatures

```ts
export declare const fail: <E>(error: E): Effect<never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Effect<never, E>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Effect<never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Effect<never, E>;
export declare const fromNullishOr: <A>(value: A): Effect<NonNullable<A>, Cause.NoSuchElementError>;
export declare const fromOption: <A>(option: Option<A>): Effect<A, Cause.NoSuchElementError>;
export declare const fromResult: <A, E>(result: Result.Result<A, E>): Effect<A, E>;
export declare const fromYieldable: <Self extends Yieldable.Any, A, E, R>(yieldable: Yieldable<Self, A, E, R>): Effect<A, E, R>;
export declare const makeSpan: (name: string, options?: SpanOptionsNoTrace): Effect<Span>;
export declare const makeSpanScoped: (name: string, options?: SpanOptionsNoTrace | undefined): Effect<Span, never, Scope>;
export declare const succeed: <A>(value: A): Effect<A>;
export declare const succeedSome: <A>(value: A): Effect<Option<A>>;
```

## Other Exports (Non-Function)

- `succeedNone` (variable)
