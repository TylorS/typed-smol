# API Reference: effect/Cause

- Import path: `effect/Cause`
- Source file: `packages/effect/src/Cause.ts`
- Function exports (callable): 40
- Non-function exports: 22

## Purpose

Structured representation of how an Effect can fail.

## Key Function Exports

- `annotate`
- `annotations`
- `combine`
- `die`
- `done`
- `Done`
- `fail`
- `filterInterruptors`
- `findDefect`
- `findDie`
- `findError`
- `findErrorOption`
- `findFail`
- `findInterrupt`
- `fromReasons`
- `hasDies`
- `hasFails`
- `hasInterrupts`

## All Function Signatures

```ts
export declare const annotate: (annotations: ServiceMap.ServiceMap<never>, options?: { readonly overwrite?: boolean | undefined; }): <E>(self: Cause<E>) => Cause<E>; // overload 1
export declare const annotate: <E>(self: Cause<E>, annotations: ServiceMap.ServiceMap<never>, options?: { readonly overwrite?: boolean | undefined; }): Cause<E>; // overload 2
export declare const annotations: <E>(self: Cause<E>): ServiceMap.ServiceMap<never>;
export declare const combine: <E2>(that: Cause<E2>): <E>(self: Cause<E>) => Cause<E | E2>; // overload 1
export declare const combine: <E, E2>(self: Cause<E>, that: Cause<E2>): Cause<E | E2>; // overload 2
export declare const die: (defect: unknown): Cause<never>;
export declare const done: <A = void>(value?: A): Effect.Effect<never, Done<A>>;
export declare const Done: <A = void>(value?: A): Done<A>;
export declare const fail: <E>(error: E): Cause<E>;
export declare const filterInterruptors: <E>(self: Cause<E>): Result.Result<Set<number>, Cause<E>>;
export declare const findDefect: <E>(self: Cause<E>): Result.Result<unknown, Cause<E>>;
export declare const findDie: <E>(self: Cause<E>): Result.Result<Die, Cause<E>>;
export declare const findError: <E>(self: Cause<E>): Result.Result<E, Cause<never>>;
export declare const findErrorOption: <E>(input: Cause<E>): Option<E>;
export declare const findFail: <E>(self: Cause<E>): Result.Result<Fail<E>, Cause<never>>;
export declare const findInterrupt: <E>(self: Cause<E>): Result.Result<Interrupt, Cause<E>>;
export declare const fromReasons: <E>(reasons: ReadonlyArray<Reason<E>>): Cause<E>;
export declare const hasDies: <E>(self: Cause<E>): boolean;
export declare const hasFails: <E>(self: Cause<E>): boolean;
export declare const hasInterrupts: <E>(self: Cause<E>): boolean;
export declare const hasInterruptsOnly: <E>(self: Cause<E>): boolean;
export declare const interrupt: (fiberId?: number | undefined): Cause<never>;
export declare const interruptors: <E>(self: Cause<E>): ReadonlySet<number>;
export declare const isCause: (self: unknown): self is Cause<unknown>;
export declare const isDieReason: <E>(self: Reason<E>): self is Die;
export declare const isDone: (u: unknown): u is Done<any>;
export declare const isExceededCapacityError: (u: unknown): u is ExceededCapacityError;
export declare const isFailReason: <E>(self: Reason<E>): self is Fail<E>;
export declare const isIllegalArgumentError: (u: unknown): u is IllegalArgumentError;
export declare const isInterruptReason: <E>(self: Reason<E>): self is Interrupt;
export declare const isNoSuchElementError: (u: unknown): u is NoSuchElementError;
export declare const isReason: (self: unknown): self is Reason<unknown>;
export declare const isTimeoutError: (u: unknown): u is TimeoutError;
export declare const isUnknownError: (u: unknown): u is UnknownError;
export declare const makeDieReason: (defect: unknown): Die;
export declare const makeFailReason: <E>(error: E): Fail<E>;
export declare const makeInterruptReason: (fiberId?: number | undefined): Interrupt;
export declare const map: <E, E2>(f: (error: Types.NoInfer<E>) => E2): (self: Cause<E>) => Cause<E2>; // overload 1
export declare const map: <E, E2>(self: Cause<E>, f: (error: Types.NoInfer<E>) => E2): Cause<E2>; // overload 2
export declare const pretty: <E>(cause: Cause<E>): string;
export declare const prettyErrors: <E>(self: Cause<E>): Array<Error>;
export declare const reasonAnnotations: <E>(self: Reason<E>): ServiceMap.ServiceMap<never>;
export declare const squash: <E>(self: Cause<E>): unknown;
```

## Other Exports (Non-Function)

- `Cause` (interface)
- `Die` (interface)
- `DoneTypeId` (variable)
- `empty` (variable)
- `ExceededCapacityError` (interface)
- `ExceededCapacityErrorTypeId` (variable)
- `Fail` (interface)
- `IllegalArgumentError` (interface)
- `IllegalArgumentErrorTypeId` (variable)
- `Interrupt` (interface)
- `InterruptorStackTrace` (class)
- `NoSuchElementError` (interface)
- `NoSuchElementErrorTypeId` (variable)
- `Reason` (type)
- `ReasonTypeId` (variable)
- `StackTrace` (class)
- `TimeoutError` (interface)
- `TimeoutErrorTypeId` (variable)
- `TypeId` (variable)
- `UnknownError` (interface)
- `UnknownErrorTypeId` (variable)
- `YieldableError` (interface)
