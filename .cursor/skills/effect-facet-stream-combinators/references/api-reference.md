# API Reference: effect/Stream#combinators

- Import path: `effect/Stream#combinators`
- Source file: `packages/effect/src/Stream.ts`
- Thematic facet: `combinators`
- Function exports (callable): 21
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `combine`
- `combineArray`
- `merge`
- `mergeAll`
- `mergeEffect`
- `mergeLeft`
- `mergeResult`
- `mergeRight`
- `zip`
- `zipFlatten`
- `zipLatest`
- `zipLatestAll`
- `zipLatestWith`
- `zipLeft`
- `zipRight`
- `zipWith`
- `zipWithArray`
- `zipWithIndex`

## All Function Signatures

```ts
export declare const combine: <A2, E2, R2, S, E, A, A3, E3, R3>(that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<A, E, void>, pullRight: Pull.Pull<A2, E2, void>) => Effect.Effect<readonly [A3, S], E3, R3>): <R>(self: Stream<A, E, R>) => Stream<A3, E3, R2 | R3 | R>; // overload 1
export declare const combine: <A, E, R, A2, E2, R2, S, A3, E3, R3>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<A, E, void>, pullRight: Pull.Pull<A2, E2, void>) => Effect.Effect<readonly [A3, S], E3, R3>): Stream<A3, E3, R | R2 | R3>; // overload 2
export declare const combineArray: <A2, E2, R2, S, E, A, A3, E3, R3>(that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, pullRight: Pull.Pull<Arr.NonEmptyReadonlyArray<A2>, E2, void>) => Effect.Effect<readonly [Arr.NonEmptyReadonlyArray<A3>, S], E3, R3>): <R>(self: Stream<A, E, R>) => Stream<A3, Pull.ExcludeDone<E3>, R2 | R3 | R>; // overload 1
export declare const combineArray: <R, A2, E2, R2, S, E, A, A3, E3, R3>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, pullRight: Pull.Pull<Arr.NonEmptyReadonlyArray<A2>, E2, void>) => Effect.Effect<readonly [Arr.NonEmptyReadonlyArray<A3>, S], E3, R3>): Stream<A3, Pull.ExcludeDone<E3>, R | R2 | R3>; // overload 2
export declare const merge: <A2, E2, R2>(that: Stream<A2, E2, R2>, options?: { readonly haltStrategy?: HaltStrategy | undefined; } | undefined): <A, E, R>(self: Stream<A, E, R>) => Stream<A | A2, E | E2, R | R2>; // overload 1
export declare const merge: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, options?: { readonly haltStrategy?: HaltStrategy | undefined; } | undefined): Stream<A | A2, E | E2, R | R2>; // overload 2
export declare const mergeAll: (options: { readonly concurrency: number | "unbounded"; readonly bufferSize?: number | undefined; }): <A, E, R>(streams: Iterable<Stream<A, E, R>>) => Stream<A, E, R>; // overload 1
export declare const mergeAll: <A, E, R>(streams: Iterable<Stream<A, E, R>>, options: { readonly concurrency: number | "unbounded"; readonly bufferSize?: number | undefined; }): Stream<A, E, R>; // overload 2
export declare const mergeEffect: <A2, E2, R2>(effect: Effect.Effect<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const mergeEffect: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, effect: Effect.Effect<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const mergeLeft: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL, ER | EL, RR | RL>; // overload 1
export declare const mergeLeft: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL, EL | ER, RL | RR>; // overload 2
export declare const mergeResult: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<Result.Result<A, A2>, E2 | E, R2 | R>; // overload 1
export declare const mergeResult: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<Result.Result<A, A2>, E | E2, R | R2>; // overload 2
export declare const mergeRight: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AR, ER | EL, RR | RL>; // overload 1
export declare const mergeRight: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AR, EL | ER, RL | RR>; // overload 2
export declare const zip: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<[A, A2], E2 | E, R2 | R>; // overload 1
export declare const zip: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<[A, A2], E | E2, R | R2>; // overload 2
export declare const zipFlatten: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A extends ReadonlyArray<any>, E, R>(self: Stream<A, E, R>) => Stream<[...A, A2], E2 | E, R2 | R>; // overload 1
export declare const zipFlatten: <A extends ReadonlyArray<any>, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<[...A, A2], E | E2, R | R2>; // overload 2
export declare const zipLatest: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<[AL, AR], EL | ER, RL | RR>; // overload 1
export declare const zipLatest: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<[AL, AR], EL | ER, RL | RR>; // overload 2
export declare const zipLatestAll: <T extends ReadonlyArray<Stream<any, any, any>>>(...streams: T): Stream<[T[number]] extends [never] ? never : { [K in keyof T]: T[K] extends Stream<infer A, infer _E, infer _R> ? A : never; }, [T[number]] extends [never] ? never : T[number] extends Stream<infer _A, infer _E, infer _R> ? _E : never, [T[number]] extends [never] ? never : T[number] extends Stream<infer _A, infer _E, infer _R> ? _R : never>;
export declare const zipLatestWith: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipLatestWith: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipLeft: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL, ER | EL, RR | RL>; // overload 1
export declare const zipLeft: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL, EL | ER, RL | RR>; // overload 2
export declare const zipRight: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AR, ER | EL, RR | RL>; // overload 1
export declare const zipRight: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AR, EL | ER, RL | RR>; // overload 2
export declare const zipWith: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipWith: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipWithArray: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: Arr.NonEmptyReadonlyArray<AL>, right: Arr.NonEmptyReadonlyArray<AR>) => readonly [output: Arr.NonEmptyReadonlyArray<A>, leftoverLeft: ReadonlyArray<AL>, leftoverRight: ReadonlyArray<AR>]): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipWithArray: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: Arr.NonEmptyReadonlyArray<AL>, right: Arr.NonEmptyReadonlyArray<AR>) => readonly [output: Arr.NonEmptyReadonlyArray<A>, leftoverLeft: ReadonlyArray<AL>, leftoverRight: ReadonlyArray<AR>]): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipWithIndex: <A, E, R>(self: Stream<A, E, R>): Stream<[A, number], E, R>;
export declare const zipWithNext: <A, E, R>(self: Stream<A, E, R>): Stream<[A, Option.Option<A>], E, R>;
export declare const zipWithPrevious: <A, E, R>(self: Stream<A, E, R>): Stream<[Option.Option<A>, A], E, R>;
export declare const zipWithPreviousAndNext: <A, E, R>(self: Stream<A, E, R>): Stream<[Option.Option<A>, A, Option.Option<A>], E, R>;
```

## Other Exports (Non-Function)

- `DefaultChunkSize` (variable)
- `Do` (variable)
- `empty` (variable)
- `Error` (type)
- `EventListener` (interface)
- `HaltStrategy` (type)
- `never` (variable)
- `Services` (type)
- `Stream` (interface)
- `StreamTypeLambda` (interface)
- `StreamUnify` (interface)
- `StreamUnifyIgnore` (interface)
- `Success` (type)
- `Variance` (interface)
- `VarianceStruct` (interface)
