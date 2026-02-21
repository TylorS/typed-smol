# API Reference: effect/unstable/reactivity/AsyncResult

- Import path: `effect/unstable/reactivity/AsyncResult`
- Source file: `packages/effect/src/unstable/reactivity/AsyncResult.ts`
- Function exports (callable): 33
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `all`
- `builder`
- `cause`
- `error`
- `fail`
- `failure`
- `failureWithPrevious`
- `failWithPrevious`
- `flatMap`
- `fromExit`
- `fromExitWithPrevious`
- `getOrElse`
- `getOrThrow`
- `initial`
- `isAsyncResult`
- `isFailure`
- `isInitial`
- `isInterrupted`

## All Function Signatures

```ts
export declare const all: <const Arg extends Iterable<any> | Record<string, any>>(results: Arg): AsyncResult<[Arg] extends [ReadonlyArray<any>] ? { -readonly [K in keyof Arg]: [Arg[K]] extends [AsyncResult<infer _A, infer _E>] ? _A : Arg[K]; } : [Arg] extends [Iterable<infer _A>] ? _A extends AsyncResult<infer _AA, infer _E> ? _AA : _A : [Arg] extends [Record<string, any>] ? { -readonly [K in keyof Arg]: [Arg[K]] extends [AsyncResult<infer _A, infer _E>] ? _A : Arg[K]; } : never, [Arg] extends [ReadonlyArray<any>] ? AsyncResult.Failure<Arg[number]> : [Arg] extends [Iterable<infer _A>] ? AsyncResult.Failure<_A> : [Arg] extends [Record<string, any>] ? AsyncResult.Failure<Arg[keyof Arg]> : never>;
export declare const builder: <A extends AsyncResult<any, any>>(self: A): Builder<never, A extends Success<infer _A, infer _E> ? _A : never, A extends Failure<infer _A, infer _E> ? _E : never, A extends Initial<infer _A, infer _E> ? true : never>;
export declare const cause: <A, E>(self: AsyncResult<A, E>): Option.Option<Cause.Cause<E>>;
export declare const error: <A, E>(self: AsyncResult<A, E>): Option.Option<E>;
export declare const fail: <E, A = never>(error: E, options?: { readonly previousSuccess?: Option.Option<Success<A, E>> | undefined; readonly waiting?: boolean | undefined; }): Failure<A, E>;
export declare const failure: <A, E = never>(cause: Cause.Cause<E>, options?: { readonly previousSuccess?: Option.Option<Success<A, E>> | undefined; readonly waiting?: boolean | undefined; }): Failure<A, E>;
export declare const failureWithPrevious: <A, E>(cause: Cause.Cause<E>, options: { readonly previous: Option.Option<AsyncResult<A, E>>; readonly waiting?: boolean | undefined; }): Failure<A, E>;
export declare const failWithPrevious: <A, E>(error: E, options: { readonly previous: Option.Option<AsyncResult<A, E>>; readonly waiting?: boolean | undefined; }): Failure<A, E>;
export declare const flatMap: <A, E, B, E2>(f: (a: A, prev: Success<A, E>) => AsyncResult<A, E2>): (self: AsyncResult<A, E>) => AsyncResult<B, E | E2>; // overload 1
export declare const flatMap: <E, A, B, E2>(self: AsyncResult<A, E>, f: (a: A, prev: Success<A, E>) => AsyncResult<B, E2>): AsyncResult<B, E | E2>; // overload 2
export declare const fromExit: <A, E>(exit: Exit.Exit<A, E>): Success<A, E> | Failure<A, E>;
export declare const fromExitWithPrevious: <A, E>(exit: Exit.Exit<A, E>, previous: Option.Option<AsyncResult<A, E>>): Success<A, E> | Failure<A, E>;
export declare const getOrElse: <B>(orElse: LazyArg<B>): <A, E>(self: AsyncResult<A, E>) => A | B; // overload 1
export declare const getOrElse: <A, E, B>(self: AsyncResult<A, E>, orElse: LazyArg<B>): A | B; // overload 2
export declare const getOrThrow: <A, E>(self: AsyncResult<A, E>): A;
export declare const initial: <A = never, E = never>(waiting?: boolean): Initial<A, E>;
export declare const isAsyncResult: (u: unknown): u is AsyncResult<unknown, unknown>;
export declare const isFailure: <A, E>(result: AsyncResult<A, E>): result is Failure<A, E>;
export declare const isInitial: <A, E>(result: AsyncResult<A, E>): result is Initial<A, E>;
export declare const isInterrupted: <A, E>(result: AsyncResult<A, E>): result is Failure<A, E>;
export declare const isNotInitial: <A, E>(result: AsyncResult<A, E>): result is Success<A, E> | Failure<A, E>;
export declare const isSuccess: <A, E>(result: AsyncResult<A, E>): result is Success<A, E>;
export declare const isWaiting: <A, E>(result: AsyncResult<A, E>): boolean;
export declare const map: <A, B>(f: (a: A) => B): <E>(self: AsyncResult<A, E>) => AsyncResult<B, E>; // overload 1
export declare const map: <E, A, B>(self: AsyncResult<A, E>, f: (a: A) => B): AsyncResult<B, E>; // overload 2
export declare const match: <A, E, X, Y, Z>(options: { readonly onInitial: (_: Initial<A, E>) => X; readonly onFailure: (_: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): (self: AsyncResult<A, E>) => X | Y | Z; // overload 1
export declare const match: <A, E, X, Y, Z>(self: AsyncResult<A, E>, options: { readonly onInitial: (_: Initial<A, E>) => X; readonly onFailure: (_: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): X | Y | Z; // overload 2
export declare const matchWithError: <A, E, W, X, Y, Z>(options: { readonly onInitial: (_: Initial<A, E>) => W; readonly onError: (error: E, _: Failure<A, E>) => X; readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): (self: AsyncResult<A, E>) => W | X | Y | Z; // overload 1
export declare const matchWithError: <A, E, W, X, Y, Z>(self: AsyncResult<A, E>, options: { readonly onInitial: (_: Initial<A, E>) => W; readonly onError: (error: E, _: Failure<A, E>) => X; readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): W | X | Y | Z; // overload 2
export declare const matchWithWaiting: <A, E, W, X, Y, Z>(options: { readonly onWaiting: (_: AsyncResult<A, E>) => W; readonly onError: (error: E, _: Failure<A, E>) => X; readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): (self: AsyncResult<A, E>) => W | X | Y | Z; // overload 1
export declare const matchWithWaiting: <A, E, W, X, Y, Z>(self: AsyncResult<A, E>, options: { readonly onWaiting: (_: AsyncResult<A, E>) => W; readonly onError: (error: E, _: Failure<A, E>) => X; readonly onDefect: (defect: unknown, _: Failure<A, E>) => Y; readonly onSuccess: (_: Success<A, E>) => Z; }): W | X | Y | Z; // overload 2
export declare const replacePrevious: <R extends AsyncResult<any, any>, XE, A>(self: R, previous: Option.Option<AsyncResult<A, XE>>): With<R, A, AsyncResult.Failure<R>>;
export declare const Schema: <A extends Schema_.Top = Schema_.Never, E extends Schema_.Top = Schema_.Never>(options: { readonly success?: A | undefined; readonly error?: E | undefined; }): Schema<A, E>;
export declare const success: <A, E = never>(value: A, options?: { readonly waiting?: boolean | undefined; readonly timestamp?: number | undefined; }): Success<A, E>;
export declare const toExit: <A, E>(self: AsyncResult<A, E>): Exit.Exit<A, E | Cause.NoSuchElementError>;
export declare const touch: <A extends AsyncResult<any, any>>(result: A): A;
export declare const value: <A, E>(self: AsyncResult<A, E>): Option.Option<A>;
export declare const waiting: <R extends AsyncResult<any, any>>(self: R, options?: { readonly touch?: boolean | undefined; }): R;
export declare const waitingFrom: <A, E>(previous: Option.Option<AsyncResult<A, E>>): AsyncResult<A, E>;
```

## Other Exports (Non-Function)

- `AsyncResult` (type)
- `Builder` (type)
- `Failure` (interface)
- `Initial` (interface)
- `Success` (interface)
- `TypeId` (type)
- `With` (type)
