# API Reference: effect/Effect#execution

- Import path: `effect/Effect#execution`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `execution`
- Function exports (callable): 22
- Non-function exports: 1

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `exit`
- `failCauseSync`
- `failSync`
- `onExit`
- `onExitIf`
- `onExitPrimitive`
- `promise`
- `requestUnsafe`
- `runCallback`
- `runCallbackWith`
- `runFork`
- `runForkWith`
- `runPromise`
- `runPromiseExit`
- `runPromiseExitWith`
- `runPromiseWith`
- `runSync`
- `runSyncExit`

## All Function Signatures

```ts
export declare const exit: <A, E, R>(self: Effect<A, E, R>): Effect<Exit.Exit<A, E>, never, R>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Effect<never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Effect<never, E>;
export declare const onExit: <A, E, XE = never, XR = never>(f: (exit: Exit.Exit<A, E>) => Effect<void, XE, XR>): <R>(self: Effect<A, E, R>) => Effect<A, E | XE, R | XR>; // overload 1
export declare const onExit: <A, E, R, XE = never, XR = never>(self: Effect<A, E, R>, f: (exit: Exit.Exit<A, E>) => Effect<void, XE, XR>): Effect<A, E | XE, R | XR>; // overload 2
export declare const onExitIf: <A, E, XE, XR, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<Exit.Exit<NoInfer<A>, NoInfer<E>>, Result>, f: (pass: Filter.Pass<Exit.Exit<NoInfer<A>, NoInfer<E>>, Result>, exit: Exit.Exit<NoInfer<A>, NoInfer<E>>) => Effect<void, XE, XR>): <R>(self: Effect<A, E, R>) => Effect<A, E | XE, R | XR>; // overload 1
export declare const onExitIf: <A, E, R, XE, XR, Result extends Filter.ResultOrBool>(self: Effect<A, E, R>, filter: Filter.OrPredicate<Exit.Exit<NoInfer<A>, NoInfer<E>>, Result>, f: (pass: Filter.Pass<Exit.Exit<NoInfer<A>, NoInfer<E>>, Result>, exit: Exit.Exit<NoInfer<A>, NoInfer<E>>) => Effect<void, XE, XR>): Effect<A, E | XE, R | XR>; // overload 2
export declare const onExitPrimitive: <A, E, R, XE = never, XR = never>(self: Effect<A, E, R>, f: (exit: Exit.Exit<A, E>) => Effect<void, XE, XR> | undefined, interruptible?: boolean): Effect<A, E | XE, R | XR>;
export declare const promise: <A>(evaluate: (signal: AbortSignal) => PromiseLike<A>): Effect<A>;
export declare const requestUnsafe: <A extends Request.Any>(self: A, options: { readonly resolver: RequestResolver<A>; readonly onExit: (exit: Exit.Exit<Request.Success<A>, Request.Error<A>>) => void; readonly services: ServiceMap.ServiceMap<never>; }): () => void;
export declare const runCallback: <A, E>(effect: Effect<A, E, never>, options?: (RunOptions & { readonly onExit: (exit: Exit.Exit<A, E>) => void; }) | undefined): (interruptor?: number | undefined) => void;
export declare const runCallbackWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>, options?: (RunOptions & { readonly onExit: (exit: Exit.Exit<A, E>) => void; }) | undefined) => (interruptor?: number | undefined) => void;
export declare const runFork: <A, E>(effect: Effect<A, E, never>, options?: RunOptions | undefined): Fiber<A, E>;
export declare const runForkWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>, options?: RunOptions | undefined) => Fiber<A, E>;
export declare const runPromise: <A, E>(effect: Effect<A, E>, options?: RunOptions | undefined): Promise<A>;
export declare const runPromiseExit: <A, E>(effect: Effect<A, E>, options?: RunOptions | undefined): Promise<Exit.Exit<A, E>>;
export declare const runPromiseExitWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>, options?: RunOptions | undefined) => Promise<Exit.Exit<A, E>>;
export declare const runPromiseWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>, options?: RunOptions | undefined) => Promise<A>;
export declare const runSync: <A, E>(effect: Effect<A, E>): A;
export declare const runSyncExit: <A, E>(effect: Effect<A, E>): Exit.Exit<A, E>;
export declare const runSyncExitWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>) => Exit.Exit<A, E>;
export declare const runSyncWith: <R>(services: ServiceMap.ServiceMap<R>): <A, E>(effect: Effect<A, E, R>) => A;
export declare const sync: <A>(thunk: LazyArg<A>): Effect<A>;
export declare const tryPromise: <A, E = Cause.UnknownError>(options: { readonly try: (signal: AbortSignal) => PromiseLike<A>; readonly catch: (error: unknown) => E; } | ((signal: AbortSignal) => PromiseLike<A>)): Effect<A, E>;
```

## Other Exports (Non-Function)

- `RunOptions` (interface)
