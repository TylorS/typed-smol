# API Reference: effect/Pull

- Import path: `effect/Pull`
- Source file: `packages/effect/src/Pull.ts`
- Function exports (callable): 9
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `catchDone`
- `doneExitFromCause`
- `filterDone`
- `filterDoneLeftover`
- `filterDoneVoid`
- `filterNoDone`
- `isDoneCause`
- `isDoneFailure`
- `matchEffect`

## All Function Signatures

```ts
export declare const catchDone: <E, A2, E2, R2>(f: (leftover: Cause.Done.Extract<E>) => Effect<A2, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A | A2, ExcludeDone<E> | E2, R | R2>; // overload 1
export declare const catchDone: <A, R, E, A2, E2, R2>(self: Effect<A, E, R>, f: (leftover: Cause.Done.Extract<E>) => Effect<A2, E2, R2>): Effect<A | A2, ExcludeDone<E> | E2, R | R2>; // overload 2
export declare const doneExitFromCause: <E>(cause: Cause.Cause<E>): Exit.Exit<Cause.Done.Extract<E>, ExcludeDone<E>>;
export declare const filterDone: <E>(input: Cause.Cause<E>): Result.Result<Cause.Done.Only<E>, Cause.Cause<ExcludeDone<E>>>;
export declare const filterDoneLeftover: <E>(cause: Cause.Cause<E>): Result.Result<Cause.Done.Extract<E>, Cause.Cause<ExcludeDone<E>>>;
export declare const filterDoneVoid: <E extends Cause.Done>(input: Cause.Cause<E>): Result.Result<Cause.Done, Cause.Cause<Exclude<E, Cause.Done>>>;
export declare const filterNoDone: <E>(input: Cause.Cause<E>): Result.Result<Cause.Cause<ExcludeDone<E>>, Cause.Cause<E>>;
export declare const isDoneCause: <E>(cause: Cause.Cause<E>): boolean;
export declare const isDoneFailure: <E>(failure: Cause.Reason<E>): failure is Cause.Fail<E & Cause.Done<any>>;
export declare const matchEffect: <A, E, L, AS, ES, RS, AF, EF, RF, AH, EH, RH>(options: { readonly onSuccess: (value: A) => Effect<AS, ES, RS>; readonly onFailure: (failure: Cause.Cause<E>) => Effect<AF, EF, RF>; readonly onDone: (leftover: L) => Effect<AH, EH, RH>; }): <R>(self: Pull<A, E, L, R>) => Effect<AS | AF | AH, ES | EF | EH, R | RS | RF | RH>; // overload 1
export declare const matchEffect: <A, E, L, R, AS, ES, RS, AF, EF, RF, AH, EH, RH>(self: Pull<A, E, L, R>, options: { readonly onSuccess: (value: A) => Effect<AS, ES, RS>; readonly onFailure: (failure: Cause.Cause<E>) => Effect<AF, EF, RF>; readonly onDone: (leftover: L) => Effect<AH, EH, RH>; }): Effect<AS | AF | AH, ES | EF | EH, R | RS | RF | RH>; // overload 2
```

## Other Exports (Non-Function)

- `Error` (type)
- `ExcludeDone` (type)
- `Leftover` (type)
- `Pull` (interface)
- `Services` (type)
- `Success` (type)
