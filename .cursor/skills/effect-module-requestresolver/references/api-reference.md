# API Reference: effect/RequestResolver

- Import path: `effect/RequestResolver`
- Source file: `packages/effect/src/RequestResolver.ts`
- Function exports (callable): 18
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `around`
- `asCache`
- `batchN`
- `fromEffect`
- `fromEffectTagged`
- `fromFunction`
- `fromFunctionBatched`
- `grouped`
- `isRequestResolver`
- `make`
- `makeGrouped`
- `makeWith`
- `persisted`
- `race`
- `setDelay`
- `setDelayEffect`
- `withCache`
- `withSpan`

## All Function Signatures

```ts
export declare const around: <A extends Request.Any, A2, X>(before: (entries: NonEmptyArray<Request.Entry<NoInfer<A>>>) => Effect.Effect<A2, Request.Error<A>>, after: (entries: NonEmptyArray<Request.Entry<NoInfer<A>>>, a: A2) => Effect.Effect<X, Request.Error<A>>): (self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const around: <A extends Request.Any, A2, X>(self: RequestResolver<A>, before: (entries: NonEmptyArray<Request.Entry<NoInfer<A>>>) => Effect.Effect<A2, Request.Error<A>>, after: (entries: NonEmptyArray<Request.Entry<NoInfer<A>>>, a: A2) => Effect.Effect<X, Request.Error<A>>): RequestResolver<A>; // overload 2
export declare const asCache: <A extends Request.Any, ServiceMode extends "lookup" | "construction" = never>(options: { readonly capacity: number; readonly timeToLive?: ((exit: Request.Result<A>, request: A) => Duration.Input) | undefined; readonly requireServicesAt?: ServiceMode | undefined; }): (self: RequestResolver<A>) => Effect.Effect<Cache.Cache<A, Request.Success<A>, Request.Error<A>, "construction" extends ServiceMode ? never : Request.Services<A>>, never, "construction" extends ServiceMode ? Request.Services<A> : never>; // overload 1
export declare const asCache: <A extends Request.Any, ServiceMode extends "lookup" | "construction" = never>(self: RequestResolver<A>, options: { readonly capacity: number; readonly timeToLive?: ((exit: Request.Result<A>, request: A) => Duration.Input) | undefined; readonly requireServicesAt?: ServiceMode | undefined; }): Effect.Effect<Cache.Cache<A, Request.Success<A>, Request.Error<A>, "construction" extends ServiceMode ? never : Request.Services<A>>, never, "construction" extends ServiceMode ? Request.Services<A> : never>; // overload 2
export declare const batchN: (n: number): <A extends Request.Any>(self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const batchN: <A extends Request.Any>(self: RequestResolver<A>, n: number): RequestResolver<A>; // overload 2
export declare const fromEffect: <A extends Request.Any>(f: (entry: Request.Entry<A>) => Effect.Effect<Request.Success<A>, Request.Error<A>>): RequestResolver<A>;
export declare const fromEffectTagged: <A extends Request.Any & { readonly _tag: string; }>(): <Fns extends { readonly [Tag in A["_tag"]]: [Extract<A, { readonly _tag: Tag; }>] extends [infer Req] ? Req extends Request.Request<infer ReqA, infer ReqE, infer _ReqR> ? (requests: Array<Request.Entry<Req>>) => Effect.Effect<Iterable<ReqA>, ReqE> : never : never; }>(fns: Fns) => RequestResolver<A>;
export declare const fromFunction: <A extends Request.Any>(f: (entry: Request.Entry<A>) => Request.Success<A>): RequestResolver<A>;
export declare const fromFunctionBatched: <A extends Request.Any>(f: (entries: NonEmptyArray<Request.Entry<A>>) => Iterable<Request.Success<A>>): RequestResolver<A>;
export declare const grouped: <A extends Request.Any, K>(f: (entry: Request.Entry<A>) => K): (self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const grouped: <A extends Request.Any, K>(self: RequestResolver<A>, f: (entry: Request.Entry<A>) => K): RequestResolver<A>; // overload 2
export declare const isRequestResolver: (u: unknown): u is RequestResolver<any>;
export declare const make: <A extends Request.Any>(runAll: (entries: NonEmptyArray<Request.Entry<A>>, key: unknown) => Effect.Effect<void, Request.Error<A>>): RequestResolver<A>;
export declare const makeGrouped: <A extends Request.Any, K>(options: { readonly key: (entry: Request.Entry<A>) => K; readonly resolver: (entries: NonEmptyArray<Request.Entry<A>>, key: K) => Effect.Effect<void, Request.Error<A>>; }): RequestResolver<A>;
export declare const makeWith: <A extends Request.Any>(options: { readonly batchKey: (request: Request.Entry<A>) => unknown; readonly preCheck?: ((entry: Request.Entry<A>) => boolean) | undefined; readonly delay: Effect.Effect<void>; readonly collectWhile: (requests: ReadonlySet<Request.Entry<A>>) => boolean; readonly runAll: (entries: NonEmptyArray<Request.Entry<A>>, key: unknown) => Effect.Effect<void, Request.Error<A>>; }): RequestResolver<A>;
export declare const persisted: <A extends Request.Request<any, Persistence.PersistenceError | Schema.SchemaError, any> & Persistable.Any>(options: { readonly storeId: string; readonly timeToLive?: ((exit: Request.Result<A>, request: A) => Duration.Input) | undefined; readonly staleWhileRevalidate?: ((exit: Request.Result<A>, request: A) => boolean) | undefined; }): (self: RequestResolver<A>) => Effect.Effect<RequestResolver<A>, never, Persistence.Persistence | Scope>; // overload 1
export declare const persisted: <A extends Request.Request<any, Persistence.PersistenceError | Schema.SchemaError, any> & Persistable.Any>(self: RequestResolver<A>, options: { readonly storeId: string; readonly timeToLive?: ((exit: Request.Result<A>, request: A) => Duration.Input) | undefined; readonly staleWhileRevalidate?: ((exit: Request.Result<A>, request: A) => boolean) | undefined; }): Effect.Effect<RequestResolver<A>, never, Persistence.Persistence | Scope>; // overload 2
export declare const race: <A2 extends Request.Any>(that: RequestResolver<A2>): <A extends Request.Any>(self: RequestResolver<A>) => RequestResolver<A2 & A>; // overload 1
export declare const race: <A extends Request.Any, A2 extends Request.Any>(self: RequestResolver<A>, that: RequestResolver<A2>): RequestResolver<A & A2>; // overload 2
export declare const setDelay: (duration: Duration.Input): <A extends Request.Any>(self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const setDelay: <A extends Request.Any>(self: RequestResolver<A>, duration: Duration.Input): RequestResolver<A>; // overload 2
export declare const setDelayEffect: (delay: Effect.Effect<void>): <A extends Request.Any>(self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const setDelayEffect: <A extends Request.Any>(self: RequestResolver<A>, delay: Effect.Effect<void>): RequestResolver<A>; // overload 2
export declare const withCache: <A extends Request.Any>(options: { readonly capacity: number; readonly strategy?: "lru" | "fifo" | undefined; }): (self: RequestResolver<A>) => Effect.Effect<RequestResolver<A>>; // overload 1
export declare const withCache: <A extends Request.Any>(self: RequestResolver<A>, options: { readonly capacity: number; readonly strategy?: "lru" | "fifo" | undefined; }): Effect.Effect<RequestResolver<A>>; // overload 2
export declare const withSpan: <A extends Request.Any>(name: string, options?: Tracer.SpanOptions | ((entries: NonEmptyArray<Request.Entry<A>>) => Tracer.SpanOptions) | undefined): (self: RequestResolver<A>) => RequestResolver<A>; // overload 1
export declare const withSpan: <A extends Request.Any>(self: RequestResolver<A>, name: string, options?: Tracer.SpanOptions | ((entries: NonEmptyArray<Request.Entry<A>>) => Tracer.SpanOptions) | undefined): RequestResolver<A>; // overload 2
```

## Other Exports (Non-Function)

- `never` (variable)
- `RequestResolver` (interface)
