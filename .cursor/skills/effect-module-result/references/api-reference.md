# API Reference: effect/Result

- Import path: `effect/Result`
- Source file: `packages/effect/src/Result.ts`
- Function exports (callable): 36
- Non-function exports: 10

## Purpose

A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## Key Function Exports

- `all`
- `andThen`
- `bind`
- `bindTo`
- `fail`
- `filterOrFail`
- `flatMap`
- `flip`
- `fromNullishOr`
- `fromOption`
- `gen`
- `getFailure`
- `getOrElse`
- `getOrNull`
- `getOrThrow`
- `getOrThrowWith`
- `getOrUndefined`
- `getSuccess`

## All Function Signatures

```ts
export declare const all: <const I extends Iterable<Result<any, any>> | Record<string, Result<any, any>>>(input: I): [I] extends [ReadonlyArray<Result<any, any>>] ? Result<{ -readonly [K in keyof I]: [I[K]] extends [Result<infer R, any>] ? R : never; }, I[number] extends never ? never : [I[number]] extends [Result<any, infer L>] ? L : never> : [I] extends [Iterable<Result<infer R, infer L>>] ? Result<Array<R>, L> : Result<{ -readonly [K in keyof I]: [I[K]] extends [Result<infer R, any>] ? R : never; }, I[keyof I] extends never ? never : [I[keyof I]] extends [Result<any, infer L>] ? L : never>;
export declare const andThen: <A, A2, E2>(f: (a: A) => Result<A2, E2>): <E>(self: Result<A, E>) => Result<A2, E | E2>; // overload 1
export declare const andThen: <A2, E2>(f: Result<A2, E2>): <A, E>(self: Result<A, E>) => Result<A2, E | E2>; // overload 2
export declare const andThen: <A, A2>(f: (a: A) => A2): <E>(self: Result<A, E>) => Result<A2, E>; // overload 3
export declare const andThen: <A2>(right: NotFunction<A2>): <A, E>(self: Result<A, E>) => Result<A2, E>; // overload 4
export declare const andThen: <A, E, A2, E2>(self: Result<A, E>, f: (a: A) => Result<A2, E2>): Result<A2, E | E2>; // overload 5
export declare const andThen: <A, E, A2, E2>(self: Result<A, E>, f: Result<A2, E2>): Result<A2, E | E2>; // overload 6
export declare const andThen: <A, E, A2>(self: Result<A, E>, f: (a: A) => A2): Result<A2, E>; // overload 7
export declare const andThen: <A, E, A2>(self: Result<A, E>, f: NotFunction<A2>): Result<A2, E>; // overload 8
export declare const bind: <N extends string, A extends object, B, L2>(name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => Result<B, L2>): <L1>(self: Result<A, L1>) => Result<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, L1 | L2>; // overload 1
export declare const bind: <A extends object, L1, N extends string, B, L2>(self: Result<A, L1>, name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => Result<B, L2>): Result<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, L1 | L2>; // overload 2
export declare const bindTo: <N extends string>(name: N): <R, L>(self: Result<R, L>) => Result<Record<N, R>, L>; // overload 1
export declare const bindTo: <R, L, N extends string>(self: Result<R, L>, name: N): Result<Record<N, R>, L>; // overload 2
export declare const fail: <E>(left: E): Result<never, E>;
export declare const filterOrFail: <A, B extends A, E2>(refinement: Refinement<NoInfer<A>, B>, orFailWith: (value: NoInfer<A>) => E2): <E>(self: Result<A, E>) => Result<B, E2 | E>; // overload 1
export declare const filterOrFail: <A, E2>(predicate: Predicate<NoInfer<A>>, orFailWith: (value: NoInfer<A>) => E2): <E>(self: Result<A, E>) => Result<A, E2 | E>; // overload 2
export declare const filterOrFail: <A, E, B extends A, E2>(self: Result<A, E>, refinement: Refinement<A, B>, orFailWith: (value: A) => E2): Result<B, E | E2>; // overload 3
export declare const filterOrFail: <A, E, E2>(self: Result<A, E>, predicate: Predicate<A>, orFailWith: (value: A) => E2): Result<A, E | E2>; // overload 4
export declare const flatMap: <A, A2, E2>(f: (a: A) => Result<A2, E2>): <E>(self: Result<A, E>) => Result<A2, E | E2>; // overload 1
export declare const flatMap: <A, E, A2, E2>(self: Result<A, E>, f: (a: A) => Result<A2, E2>): Result<A2, E | E2>; // overload 2
export declare const flip: <A, E>(self: Result<A, E>): Result<E, A>;
export declare const fromNullishOr: <A, E>(onNullish: (a: A) => E): (self: A) => Result<NonNullable<A>, E>; // overload 1
export declare const fromNullishOr: <A, E>(self: A, onNullish: (a: A) => E): Result<NonNullable<A>, E>; // overload 2
export declare const fromOption: <E>(onNone: () => E): <A>(self: Option<A>) => Result<A, E>; // overload 1
export declare const fromOption: <A, E>(self: Option<A>, onNone: () => E): Result<A, E>; // overload 2
export declare const gen: <Self, K extends Result<any, any> | Gen.Variance<ResultTypeLambda, any, any, any>, A>(...args: [self: Self, body: (this: Self) => Generator<K, A, never>] | [body: () => Generator<K, A, never>]): Result<A, [K] extends [Gen.Variance<ResultTypeLambda, any, any, infer E>] ? E : [K] extends [Result<any, infer E>] ? E : never>;
export declare const getFailure: <A, E>(self: Result<A, E>): Option<E>;
export declare const getOrElse: <E, A2>(onFailure: (err: E) => A2): <A>(self: Result<A, E>) => A2 | A; // overload 1
export declare const getOrElse: <A, E, A2>(self: Result<A, E>, onFailure: (err: E) => A2): A | A2; // overload 2
export declare const getOrNull: <A, E>(self: Result<A, E>): A | null;
export declare const getOrThrow: <A, E>(self: Result<A, E>): A;
export declare const getOrThrowWith: <E>(onFailure: (err: E) => unknown): <A>(self: Result<A, E>) => A; // overload 1
export declare const getOrThrowWith: <A, E>(self: Result<A, E>, onFailure: (err: E) => unknown): A; // overload 2
export declare const getOrUndefined: <A, E>(self: Result<A, E>): A | undefined;
export declare const getSuccess: <A, E>(self: Result<A, E>): Option<A>;
export declare const isFailure: <A, E>(self: Result<A, E>): self is Failure<A, E>;
export declare const isResult: (input: unknown): input is Result<unknown, unknown>;
export declare const isSuccess: <A, E>(self: Result<A, E>): self is Success<A, E>;
export declare const let: <N extends string, R extends object, B>(name: Exclude<N, keyof R>, f: (r: NoInfer<R>) => B): <L>(self: Result<R, L>) => Result<{ [K in N | keyof R]: K extends keyof R ? R[K] : B; }, L>; // overload 1
export declare const let: <R extends object, L, N extends string, B>(self: Result<R, L>, name: Exclude<N, keyof R>, f: (r: NoInfer<R>) => B): Result<{ [K in N | keyof R]: K extends keyof R ? R[K] : B; }, L>; // overload 2
export declare const liftPredicate: <A, B extends A, E>(refinement: Refinement<A, B>, orFailWith: (a: A) => E): (a: A) => Result<B, E>; // overload 1
export declare const liftPredicate: <B extends A, E, A = B>(predicate: Predicate<A>, orFailWith: (a: A) => E): (a: B) => Result<B, E>; // overload 2
export declare const liftPredicate: <A, E, B extends A>(self: A, refinement: Refinement<A, B>, orFailWith: (a: A) => E): Result<B, E>; // overload 3
export declare const liftPredicate: <B extends A, E, A = B>(self: B, predicate: Predicate<A>, orFailWith: (a: A) => E): Result<B, E>; // overload 4
export declare const makeEquivalence: <A, E>(success: Equivalence.Equivalence<A>, failure: Equivalence.Equivalence<E>): Equivalence.Equivalence<Result<A, E>>;
export declare const map: <A, A2>(f: (ok: A) => A2): <E>(self: Result<A, E>) => Result<A2, E>; // overload 1
export declare const map: <A, E, A2>(self: Result<A, E>, f: (ok: A) => A2): Result<A2, E>; // overload 2
export declare const mapBoth: <E, E2, A, A2>(options: { readonly onFailure: (left: E) => E2; readonly onSuccess: (right: A) => A2; }): (self: Result<A, E>) => Result<A2, E2>; // overload 1
export declare const mapBoth: <E, A, E2, A2>(self: Result<A, E>, options: { readonly onFailure: (left: E) => E2; readonly onSuccess: (right: A) => A2; }): Result<A2, E2>; // overload 2
export declare const mapError: <E, E2>(f: (err: E) => E2): <A>(self: Result<A, E>) => Result<A, E2>; // overload 1
export declare const mapError: <A, E, E2>(self: Result<A, E>, f: (err: E) => E2): Result<A, E2>; // overload 2
export declare const match: <E, B, A, C = B>(options: { readonly onFailure: (error: E) => B; readonly onSuccess: (ok: A) => C; }): (self: Result<A, E>) => B | C; // overload 1
export declare const match: <A, E, B, C = B>(self: Result<A, E>, options: { readonly onFailure: (error: E) => B; readonly onSuccess: (ok: A) => C; }): B | C; // overload 2
export declare const merge: <A, E>(self: Result<A, E>): E | A;
export declare const orElse: <E, A2, E2>(that: (err: E) => Result<A2, E2>): <A>(self: Result<A, E>) => Result<A | A2, E2>; // overload 1
export declare const orElse: <A, E, A2, E2>(self: Result<A, E>, that: (err: E) => Result<A2, E2>): Result<A | A2, E2>; // overload 2
export declare const succeed: <A>(right: A): Result<A>;
export declare const succeedSome: <A, E = never>(a: A): Result<Option<A>, E>;
export declare const tap: <A>(f: (a: A) => void): <E>(self: Result<A, E>) => Result<A, E>; // overload 1
export declare const tap: <A, E>(self: Result<A, E>, f: (a: A) => void): Result<A, E>; // overload 2
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
