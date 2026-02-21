# API Reference: effect/Request

- Import path: `effect/Request`
- Source file: `packages/effect/src/Request.ts`
- Function exports (callable): 10
- Non-function exports: 11

## Purpose

The `Request` module provides a way to model requests to external data sources in a functional and composable manner. Requests represent descriptions of operations that can be batched, cached, and executed efficiently.

## Key Function Exports

- `complete`
- `completeEffect`
- `fail`
- `failCause`
- `isRequest`
- `makeEntry`
- `of`
- `succeed`
- `tagged`
- `TaggedClass`

## All Function Signatures

```ts
export declare const complete: <A extends Any>(result: Result<A>): (self: Entry<A>) => Effect.Effect<void>; // overload 1
export declare const complete: <A extends Any>(self: Entry<A>, result: Result<A>): Effect.Effect<void>; // overload 2
export declare const completeEffect: <A extends Any, R>(effect: Effect.Effect<Success<A>, Error<A>, R>): (self: Entry<A>) => Effect.Effect<void, never, R>; // overload 1
export declare const completeEffect: <A extends Any, R>(self: Entry<A>, effect: Effect.Effect<Success<A>, Error<A>, R>): Effect.Effect<void, never, R>; // overload 2
export declare const fail: <A extends Any>(error: Error<A>): (self: Entry<A>) => Effect.Effect<void>; // overload 1
export declare const fail: <A extends Any>(self: Entry<A>, error: Error<A>): Effect.Effect<void>; // overload 2
export declare const failCause: <A extends Any>(cause: Cause.Cause<Error<A>>): (self: Entry<A>) => Effect.Effect<void>; // overload 1
export declare const failCause: <A extends Any>(self: Entry<A>, cause: Cause.Cause<Error<A>>): Effect.Effect<void>; // overload 2
export declare const isRequest: (u: unknown): u is Request<unknown, unknown, unknown>;
export declare const makeEntry: <R>(options: { readonly request: R; readonly services: ServiceMap.ServiceMap<[R] extends [Request<infer _A, infer _E, infer _R>] ? _R : never>; readonly uninterruptible: boolean; readonly completeUnsafe: (exit: Exit.Exit<[R] extends [Request<infer _A, infer _E, infer _R>] ? _A : never, [R] extends [Request<infer _A, infer _E, infer _R>] ? _E : never>) => void; }): Entry<R>;
export declare const of: <R extends Request<any, any, any>>(): Constructor<R>;
export declare const succeed: <A extends Any>(value: Success<A>): (self: Entry<A>) => Effect.Effect<void>; // overload 1
export declare const succeed: <A extends Any>(self: Entry<A>, value: Success<A>): Effect.Effect<void>; // overload 2
export declare const tagged: <R extends Request<any, any, any> & { _tag: string; }>(tag: R["_tag"]): Constructor<R, "_tag">;
export declare const TaggedClass: <Tag extends string>(tag: Tag): new <A extends Record<string, any>, Success, Error = never, Services = never>(args: Types.Equals<Omit<A, keyof Request<unknown, unknown>>, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" | keyof Request<any, any, any> ? never : P]: A[P]; }) => Request<Success, Error, Services> & Readonly<A> & { readonly _tag: Tag; };
```

## Other Exports (Non-Function)

- `Any` (type)
- `Class` (variable)
- `Constructor` (interface)
- `Entry` (interface)
- `Error` (type)
- `Request` (interface)
- `RequestPrototype` (variable)
- `Result` (type)
- `Services` (type)
- `Success` (type)
- `Variance` (interface)
