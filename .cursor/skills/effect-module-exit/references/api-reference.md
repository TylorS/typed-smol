# API Reference: effect/Exit

- Import path: `effect/Exit`
- Source file: `packages/effect/src/Exit.ts`
- Function exports (callable): 26
- Non-function exports: 4

## Purpose

Represents the outcome of an Effect computation as a plain, synchronously inspectable value.

## Key Function Exports

- `asVoid`
- `asVoidAll`
- `die`
- `fail`
- `failCause`
- `filterCause`
- `filterFailure`
- `filterSuccess`
- `filterValue`
- `findDefect`
- `findError`
- `findErrorOption`
- `getCause`
- `getSuccess`
- `hasDies`
- `hasFails`
- `hasInterrupts`
- `interrupt`

## All Function Signatures

```ts
export declare const asVoid: <A, E>(self: Exit<A, E>): Exit<void, E>;
export declare const asVoidAll: <I extends Iterable<Exit<any, any>>>(exits: I): Exit<void, I extends Iterable<Exit<infer _A, infer _E>> ? _E : never>;
export declare const die: (defect: unknown): Exit<never>;
export declare const fail: <E>(e: E): Exit<never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Exit<never, E>;
export declare const filterCause: <A, E>(self: Exit<A, E>): Result.Result<Cause.Cause<E>, Success<A>>;
export declare const filterFailure: <A, E>(self: Exit<A, E>): Result.Result<Failure<never, E>, Success<A>>;
export declare const filterSuccess: <A, E>(self: Exit<A, E>): Result.Result<Success<A>, Failure<never, E>>;
export declare const filterValue: <A, E>(self: Exit<A, E>): Result.Result<A, Failure<never, E>>;
export declare const findDefect: <A, E>(input: Exit<A, E>): Result.Result<unknown, Exit<A, E>>;
export declare const findError: <A, E>(input: Exit<A, E>): Result.Result<E, Exit<A, E>>;
export declare const findErrorOption: <A, E>(self: Exit<A, E>): Option<E>;
export declare const getCause: <A, E>(self: Exit<A, E>): Option<Cause.Cause<E>>;
export declare const getSuccess: <A, E>(self: Exit<A, E>): Option<A>;
export declare const hasDies: <A, E>(self: Exit<A, E>): self is Failure<A, E>;
export declare const hasFails: <A, E>(self: Exit<A, E>): self is Failure<A, E>;
export declare const hasInterrupts: <A, E>(self: Exit<A, E>): self is Failure<A, E>;
export declare const interrupt: (fiberId?: number | undefined): Exit<never>;
export declare const isExit: (u: unknown): u is Exit<unknown, unknown>;
export declare const isFailure: <A, E>(self: Exit<A, E>): self is Failure<A, E>;
export declare const isSuccess: <A, E>(self: Exit<A, E>): self is Success<A, E>;
export declare const map: <A, B>(f: (a: A) => B): <E>(self: Exit<A, E>) => Exit<B, E>; // overload 1
export declare const map: <A, E, B>(self: Exit<A, E>, f: (a: A) => B): Exit<B, E>; // overload 2
export declare const mapBoth: <E, E2, A, A2>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): (self: Exit<A, E>) => Exit<A2, E2>; // overload 1
export declare const mapBoth: <A, E, E2, A2>(self: Exit<A, E>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): Exit<A2, E2>; // overload 2
export declare const mapError: <E, E2>(f: (a: NoInfer<E>) => E2): <A>(self: Exit<A, E>) => Exit<A, E2>; // overload 1
export declare const mapError: <A, E, E2>(self: Exit<A, E>, f: (a: NoInfer<E>) => E2): Exit<A, E2>; // overload 2
export declare const match: <A, E, X1, X2>(options: { readonly onSuccess: (a: NoInfer<A>) => X1; readonly onFailure: (cause: Cause.Cause<NoInfer<E>>) => X2; }): (self: Exit<A, E>) => X1 | X2; // overload 1
export declare const match: <A, E, X1, X2>(self: Exit<A, E>, options: { readonly onSuccess: (a: A) => X1; readonly onFailure: (cause: Cause.Cause<E>) => X2; }): X1 | X2; // overload 2
export declare const succeed: <A>(a: A): Exit<A>;
```

## Other Exports (Non-Function)

- `Exit` (type)
- `Failure` (interface)
- `Success` (interface)
- `void` (variable)
