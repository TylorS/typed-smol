# API Reference: effect/Effect#resource-scope

- Import path: `effect/Effect#resource-scope`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `resource-scope`
- Function exports (callable): 8
- Non-function exports: 1

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `acquireRelease`
- `acquireUseRelease`
- `addFinalizer`
- `forkScoped`
- `makeSpanScoped`
- `scoped`
- `scopedWith`
- `withSpanScoped`

## All Function Signatures

```ts
export declare const acquireRelease: <A, E, R>(acquire: Effect<A, E, R>, release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect<unknown>): Effect<A, E, R | Scope>;
export declare const acquireUseRelease: <Resource, E, R, A, E2, R2, E3, R3>(acquire: Effect<Resource, E, R>, use: (a: Resource) => Effect<A, E2, R2>, release: (a: Resource, exit: Exit.Exit<A, E2>) => Effect<void, E3, R3>): Effect<A, E | E2 | E3, R | R2 | R3>;
export declare const addFinalizer: <R>(finalizer: (exit: Exit.Exit<unknown, unknown>) => Effect<void, never, R>): Effect<void, never, R | Scope>;
export declare const forkScoped: <Arg extends Effect<any, any, any> | { readonly startImmediately?: boolean | undefined; readonly uninterruptible?: boolean | "inherit" | undefined; } | undefined = { readonly startImmediately?: boolean | undefined; readonly uninterruptible?: boolean | "inherit" | undefined; }>(effectOrOptions?: Arg, options?: { readonly startImmediately?: boolean | undefined; readonly uninterruptible?: boolean | "inherit" | undefined; } | undefined): [Arg] extends [Effect<infer _A, infer _E, infer _R>] ? Effect<Fiber<_A, _E>, never, _R> : <A, E, R>(self: Effect<A, E, R>) => Effect<Fiber<A, E>, never, R | Scope>;
export declare const makeSpanScoped: (name: string, options?: SpanOptionsNoTrace | undefined): Effect<Span, never, Scope>;
export declare const scoped: <A, E, R>(self: Effect<A, E, R>): Effect<A, E, Exclude<R, Scope>>;
export declare const scopedWith: <A, E, R>(f: (scope: Scope) => Effect<A, E, R>): Effect<A, E, R>;
export declare const withSpanScoped: (name: string, options?: SpanOptions): <A, E, R>(self: Effect<A, E, R>) => Effect<A, E, Exclude<R, ParentSpan> | Scope>; // overload 1
export declare const withSpanScoped: <A, E, R>(self: Effect<A, E, R>, name: string, options?: SpanOptions): Effect<A, E, Exclude<R, ParentSpan> | Scope>; // overload 2
```

## Other Exports (Non-Function)

- `scope` (variable)
