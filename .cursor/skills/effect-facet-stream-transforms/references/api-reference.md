# API Reference: effect/Stream#transforms

- Import path: `effect/Stream#transforms`
- Source file: `packages/effect/src/Stream.ts`
- Thematic facet: `transforms`
- Function exports (callable): 18
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decodeText`
- `encodeText`
- `filter`
- `filterEffect`
- `flatMap`
- `map`
- `mapAccum`
- `mapAccumArray`
- `mapAccumArrayEffect`
- `mapAccumEffect`
- `mapArray`
- `mapArrayEffect`
- `mapBoth`
- `mapEffect`
- `mapError`
- `switchMap`
- `transformPull`
- `transformPullBracket`

## All Function Signatures

```ts
export declare const decodeText: <Arg extends Stream<Uint8Array, any, any> | { readonly encoding?: string | undefined; } | undefined = { readonly encoding?: string | undefined; }>(streamOrOptions?: Arg, options?: { readonly encoding?: string | undefined; } | undefined): [Arg] extends [Stream<Uint8Array, infer _E, infer _R>] ? Stream<string, _E, _R> : <E, R>(self: Stream<Uint8Array, E, R>) => Stream<string, E, R>;
export declare const encodeText: <E, R>(self: Stream<string, E, R>): Stream<Uint8Array, E, R>;
export declare const filter: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const filter: <A, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<NoInfer<A>, Result>): <E, R>(self: Stream<A, E, R>) => Stream<Filter.Pass<A, Result>, E, R>; // overload 2
export declare const filter: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: Refinement<A, B>): Stream<B, E, R>; // overload 3
export declare const filter: <A, E, R, Result extends Filter.ResultOrBool>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>): Stream<Filter.Pass<A, Result>, E, R>; // overload 4
export declare const filterEffect: <A, B, X, EX, RX>(filter: Filter.FilterEffect<A, B, X, EX, RX>): <E, R>(self: Stream<A, E, R>) => Stream<B, E | EX, R | RX>; // overload 1
export declare const filterEffect: <A, E, R, B, X, EX, RX>(self: Stream<A, E, R>, filter: Filter.FilterEffect<A, B, X, EX, RX>): Stream<B, E | EX, R | RX>; // overload 2
export declare const flatMap: <A, A2, E2, R2>(f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const flatMap: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const map: <A, B>(f: (a: A, i: number) => B): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const map: <A, E, R, B>(self: Stream<A, E, R>, f: (a: A, i: number) => B): Stream<B, E, R>; // overload 2
export declare const mapAccum: <S, A, B>(initial: LazyArg<S>, f: (s: S, a: A) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapAccum: <A, E, R, S, B>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: A) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E, R>; // overload 2
export declare const mapAccumArray: <S, A, B>(initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapAccumArray: <A, E, R, S, B>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => Array<B>) | undefined; }): Stream<B, E, R>; // overload 2
export declare const mapAccumArrayEffect: <S, A, B, E2, R2>(initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapAccumArrayEffect: <A, E, R, S, B, E2, R2>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapAccumEffect: <S, A, B, E2, R2>(initial: LazyArg<S>, f: (s: S, a: A) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapAccumEffect: <A, E, R, S, B, E2, R2>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: A) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapArray: <A, B>(f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Arr.NonEmptyReadonlyArray<B>): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapArray: <A, E, R, B>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Arr.NonEmptyReadonlyArray<B>): Stream<B, E, R>; // overload 2
export declare const mapArrayEffect: <A, B, E2, R2>(f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Effect.Effect<Arr.NonEmptyReadonlyArray<B>, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapArrayEffect: <A, E, R, B, E2, R2>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Effect.Effect<Arr.NonEmptyReadonlyArray<B>, E2, R2>): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapBoth: <E, E2, A, A2>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): <R>(self: Stream<A, E, R>) => Stream<A2, E2, R>; // overload 1
export declare const mapBoth: <A, E, R, E2, A2>(self: Stream<A, E, R>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): Stream<A2, E2, R>; // overload 2
export declare const mapEffect: <A, A2, E2, R2>(f: (a: A, i: number) => Effect.Effect<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const mapEffect: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A, i: number) => Effect.Effect<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const mapError: <E, E2>(f: (error: E) => E2): <A, R>(self: Stream<A, E, R>) => Stream<A, E2, R>; // overload 1
export declare const mapError: <A, E, R, E2>(self: Stream<A, E, R>, f: (error: E) => E2): Stream<A, E2, R>; // overload 2
export declare const switchMap: <A, A2, E2, R2>(f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const switchMap: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const transformPull: <A, E, R, B, E2, R2, EX, RX>(self: Stream<A, E, R>, f: (pull: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, scope: Scope.Scope) => Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<B>, E2, void, R2>, EX, RX>): Stream<B, EX | Pull.ExcludeDone<E2>, R | R2 | RX>;
export declare const transformPullBracket: <A, E, R, B, E2, R2, EX, RX>(self: Stream<A, E, R>, f: (pull: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void, R>, scope: Scope.Scope, forkedScope: Scope.Scope) => Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<B>, E2, void, R2>, EX, RX>): Stream<B, EX | Pull.ExcludeDone<E2>, R | R2 | RX>;
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
