# API Reference: effect/unstable/reactivity/Atom

- Import path: `effect/unstable/reactivity/Atom`
- Source file: `packages/effect/src/unstable/reactivity/Atom.ts`
- Function exports (callable): 46
- Non-function exports: 23

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `autoDispose`
- `batch`
- `context`
- `debounce`
- `family`
- `fn`
- `fnSync`
- `get`
- `getResult`
- `getServerValue`
- `initialValue`
- `isAtom`
- `isSerializable`
- `isWritable`
- `keepAlive`
- `kvs`
- `make`
- `makeRefreshOnSignal`

## All Function Signatures

```ts
export declare const autoDispose: <A extends Atom<any>>(self: A): A;
export declare const batch: (f: () => void): void;
export declare const context: (options: { readonly memoMap: Layer.MemoMap; }): RuntimeFactory;
export declare const debounce: (duration: Duration.Input): <A extends Atom<any>>(self: A) => WithoutSerializable<A>; // overload 1
export declare const debounce: <A extends Atom<any>>(self: A, duration: Duration.Input): WithoutSerializable<A>; // overload 2
export declare const family: <Arg, T extends object>(f: (arg: Arg) => T): (arg: Arg) => T;
export declare const fn: <Arg>(): <E, A>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | AtomRegistry>, options?: { readonly initialValue?: A | undefined; readonly concurrent?: boolean | undefined; }) => AtomResultFn<Arg, A, E>; // overload 1
export declare const fn: <E, A, Arg = void>(fn: (arg: Arg, get: FnContext) => Effect.Effect<A, E, Scope.Scope | AtomRegistry>, options?: { readonly initialValue?: A | undefined; readonly concurrent?: boolean | undefined; }): AtomResultFn<Arg, A, E>; // overload 2
export declare const fn: <Arg>(): <E, A>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, AtomRegistry>, options?: { readonly initialValue?: A | undefined; readonly concurrent?: boolean | undefined; }) => AtomResultFn<Arg, A, E | Cause.NoSuchElementError>; // overload 3
export declare const fn: <E, A, Arg = void>(fn: (arg: Arg, get: FnContext) => Stream.Stream<A, E, AtomRegistry>, options?: { readonly initialValue?: A | undefined; readonly concurrent?: boolean | undefined; }): AtomResultFn<Arg, A, E | Cause.NoSuchElementError>; // overload 4
export declare const fnSync: <Arg>(): { <A>(f: (arg: Arg, get: FnContext) => A): Writable<Option.Option<A>, Arg>; <A>(f: (arg: Arg, get: FnContext) => A, options: { readonly initialValue: A; }): Writable<A, Arg>; }; // overload 1
export declare const fnSync: <A, Arg = void>(f: (arg: Arg, get: FnContext) => A): Writable<Option.Option<A>, Arg>; // overload 2
export declare const fnSync: <A, Arg = void>(f: (arg: Arg, get: FnContext) => A, options: { readonly initialValue: A; }): Writable<A, Arg>; // overload 3
export declare const get: <A>(self: Atom<A>): Effect.Effect<A, never, AtomRegistry>;
export declare const getResult: <A, E>(self: Atom<AsyncResult.AsyncResult<A, E>>, options?: { readonly suspendOnWaiting?: boolean | undefined; }): Effect.Effect<A, E, AtomRegistry>;
export declare const getServerValue: (registry: Registry.AtomRegistry): <A>(self: Atom<A>) => A; // overload 1
export declare const getServerValue: <A>(self: Atom<A>, registry: Registry.AtomRegistry): A; // overload 2
export declare const initialValue: <A>(initialValue: A): (self: Atom<A>) => readonly [Atom<A>, A]; // overload 1
export declare const initialValue: <A>(self: Atom<A>, initialValue: A): readonly [Atom<A>, A]; // overload 2
export declare const isAtom: (u: unknown): u is Atom<any>;
export declare const isSerializable: (self: Atom<any>): self is Atom<any> & Serializable<any>;
export declare const isWritable: <R, W>(atom: Atom<R>): atom is Writable<R, W>;
export declare const keepAlive: <A extends Atom<any>>(self: A): A;
export declare const kvs: <S extends Schema.Codec<any, any>, const Mode extends "sync" | "async" = never>(options: { readonly runtime: AtomRuntime<KeyValueStore.KeyValueStore, any>; readonly key: string; readonly schema: S; readonly defaultValue: LazyArg<S["Type"]>; readonly mode?: Mode | undefined; }): Writable<"async" extends Mode ? AsyncResult.AsyncResult<S["Type"]> : S["Type"], S["Type"]>;
export declare const make: <A, E>(create: (get: Context) => Effect.Effect<A, E, Scope.Scope | AtomRegistry>, options?: { readonly initialValue?: A | undefined; readonly uninterruptible?: boolean | undefined; }): Atom<AsyncResult.AsyncResult<A, E>>; // overload 1
export declare const make: <A, E>(effect: Effect.Effect<A, E, Scope.Scope | AtomRegistry>, options?: { readonly initialValue?: A; readonly uninterruptible?: boolean | undefined; }): Atom<AsyncResult.AsyncResult<A, E>>; // overload 2
export declare const make: <A, E>(create: (get: Context) => Stream.Stream<A, E, AtomRegistry>, options?: { readonly initialValue?: A; }): Atom<AsyncResult.AsyncResult<A, E>>; // overload 3
export declare const make: <A, E>(stream: Stream.Stream<A, E, AtomRegistry>, options?: { readonly initialValue?: A; }): Atom<AsyncResult.AsyncResult<A, E>>; // overload 4
export declare const make: <A>(create: (get: Context) => A): Atom<A>; // overload 5
export declare const make: <A>(initialValue: A): Writable<A>; // overload 6
export declare const makeRefreshOnSignal: <_>(signal: Atom<_>): <A extends Atom<any>>(self: A) => WithoutSerializable<A>;
export declare const map: <R extends Atom<any>, B>(f: (_: Type<R>) => B): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Atom<B>; // overload 1
export declare const map: <R extends Atom<any>, B>(self: R, f: (_: Type<R>) => B): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Atom<B>; // overload 2
export declare const mapResult: <R extends Atom<AsyncResult.AsyncResult<any, any>>, B>(f: (_: AsyncResult.AsyncResult.Success<Type<R>>) => B): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<AsyncResult.AsyncResult<B, AsyncResult.AsyncResult.Failure<Type<R>>>, RW> : Atom<AsyncResult.AsyncResult<B, AsyncResult.AsyncResult.Failure<Type<R>>>>; // overload 1
export declare const mapResult: <R extends Atom<AsyncResult.AsyncResult<any, any>>, B>(self: R, f: (_: AsyncResult.AsyncResult.Success<Type<R>>) => B): [R] extends [Writable<infer _, infer RW>] ? Writable<AsyncResult.AsyncResult<B, AsyncResult.AsyncResult.Failure<Type<R>>>, RW> : Atom<AsyncResult.AsyncResult<B, AsyncResult.AsyncResult.Failure<Type<R>>>>; // overload 2
export declare const modify: <R, W, A>(f: (_: R) => [returnValue: A, nextValue: W]): (self: Writable<R, W>) => Effect.Effect<A, never, AtomRegistry>; // overload 1
export declare const modify: <R, W, A>(self: Writable<R, W>, f: (_: R) => [returnValue: A, nextValue: W]): Effect.Effect<A, never, AtomRegistry>; // overload 2
export declare const mount: <A>(self: Atom<A>): Effect.Effect<void, never, AtomRegistry | Scope.Scope>;
export declare const optimistic: <A>(self: Atom<A>): Writable<A, Atom<AsyncResult.AsyncResult<A, unknown>>>;
export declare const optimisticFn: <A, W, XA, XE, OW = void>(options: { readonly reducer: (current: NoInfer<A>, update: OW) => NoInfer<W>; readonly fn: AtomResultFn<OW, XA, XE> | ((set: (result: NoInfer<W>) => void) => AtomResultFn<OW, XA, XE>); }): (self: Writable<A, Atom<AsyncResult.AsyncResult<W, unknown>>>) => AtomResultFn<OW, XA, XE>; // overload 1
export declare const optimisticFn: <A, W, XA, XE, OW = void>(self: Writable<A, Atom<AsyncResult.AsyncResult<W, unknown>>>, options: { readonly reducer: (current: NoInfer<A>, update: OW) => NoInfer<W>; readonly fn: AtomResultFn<OW, XA, XE> | ((set: (result: NoInfer<W>) => void) => AtomResultFn<OW, XA, XE>); }): AtomResultFn<OW, XA, XE>; // overload 2
export declare const pull: <A, E>(create: ((get: Context) => Stream.Stream<A, E, AtomRegistry>) | Stream.Stream<A, E, AtomRegistry>, options?: { readonly disableAccumulation?: boolean | undefined; }): Writable<PullResult<A, E>, void>;
export declare const readable: <A>(read: (get: Context) => A, refresh?: (f: <A>(atom: Atom<A>) => void) => void): Atom<A>;
export declare const refresh: <A>(self: Atom<A>): Effect.Effect<void, never, AtomRegistry>;
export declare const refreshOnWindowFocus: <A extends Atom<any>>(self: A): WithoutSerializable<A>;
export declare const runtime: <R, E>(create: Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity> | ((get: Context) => Layer.Layer<R, E, AtomRegistry | Reactivity.Reactivity>)): AtomRuntime<R, E>;
export declare const searchParam: <S extends Schema.Codec<any, string> = never>(name: string, options?: { readonly schema?: S | undefined; }): Writable<S extends never ? string : Option.Option<S["Type"]>>;
export declare const serializable: <R extends Atom<any>, S extends Schema.Codec<Type<R>, any>>(options: { readonly key: string; readonly schema: S; }): (self: R) => R & Serializable<S>; // overload 1
export declare const serializable: <R extends Atom<any>, S extends Schema.Codec<Type<R>, any>>(self: R, options: { readonly key: string; readonly schema: S; }): R & Serializable<S>; // overload 2
export declare const set: <W>(value: W): <R>(self: Writable<R, W>) => Effect.Effect<void, never, AtomRegistry>; // overload 1
export declare const set: <R, W>(self: Writable<R, W>, value: W): Effect.Effect<void, never, AtomRegistry>; // overload 2
export declare const setIdleTTL: (duration: Duration.Input): <A extends Atom<any>>(self: A) => A; // overload 1
export declare const setIdleTTL: <A extends Atom<any>>(self: A, duration: Duration.Input): A; // overload 2
export declare const setLazy: (lazy: boolean): <A extends Atom<any>>(self: A) => A; // overload 1
export declare const setLazy: <A extends Atom<any>>(self: A, lazy: boolean): A; // overload 2
export declare const subscriptionRef: <A>(ref: SubscriptionRef.SubscriptionRef<A> | ((get: Context) => SubscriptionRef.SubscriptionRef<A>)): Writable<A>; // overload 1
export declare const subscriptionRef: <A, E>(effect: Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | AtomRegistry> | ((get: Context) => Effect.Effect<SubscriptionRef.SubscriptionRef<A>, E, Scope.Scope | AtomRegistry>)): Writable<AsyncResult.AsyncResult<A, E>, A>; // overload 2
export declare const toStream: <A>(self: Atom<A>): Stream.Stream<A, never, AtomRegistry>;
export declare const toStreamResult: <A, E>(self: Atom<AsyncResult.AsyncResult<A, E>>): Stream.Stream<A, E, AtomRegistry>;
export declare const transform: <R extends Atom<any>, B>(f: (get: Context, atom: R) => B): (self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Atom<B>; // overload 1
export declare const transform: <R extends Atom<any>, B>(self: R, f: (get: Context, atom: R) => B): [R] extends [Writable<infer _, infer RW>] ? Writable<B, RW> : Atom<B>; // overload 2
export declare const update: <R, W>(f: (_: R) => W): (self: Writable<R, W>) => Effect.Effect<void, never, AtomRegistry>; // overload 1
export declare const update: <R, W>(self: Writable<R, W>, f: (_: R) => W): Effect.Effect<void, never, AtomRegistry>; // overload 2
export declare const withFallback: <E2, A2>(fallback: Atom<AsyncResult.AsyncResult<A2, E2>>): <R extends Atom<AsyncResult.AsyncResult<any, any>>>(self: R) => [R] extends [Writable<infer _, infer RW>] ? Writable<AsyncResult.AsyncResult<AsyncResult.AsyncResult.Success<Type<R>> | A2, AsyncResult.AsyncResult.Failure<Type<R>> | E2>, RW> : Atom<AsyncResult.AsyncResult<AsyncResult.AsyncResult.Success<Type<R>> | A2, AsyncResult.AsyncResult.Failure<Type<R>> | E2>>; // overload 1
export declare const withFallback: <R extends Atom<AsyncResult.AsyncResult<any, any>>, A2, E2>(self: R, fallback: Atom<AsyncResult.AsyncResult<A2, E2>>): [R] extends [Writable<infer _, infer RW>] ? Writable<AsyncResult.AsyncResult<AsyncResult.AsyncResult.Success<Type<R>> | A2, AsyncResult.AsyncResult.Failure<Type<R>> | E2>, RW> : Atom<AsyncResult.AsyncResult<AsyncResult.AsyncResult.Success<Type<R>> | A2, AsyncResult.AsyncResult.Failure<Type<R>> | E2>>; // overload 2
export declare const withLabel: (name: string): <A extends Atom<any>>(self: A) => A; // overload 1
export declare const withLabel: <A extends Atom<any>>(self: A, name: string): A; // overload 2
export declare const withReactivity: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A extends Atom<any>>(atom: A) => A;
export declare const withRefresh: (duration: Duration.Input): <A extends Atom<any>>(self: A) => WithoutSerializable<A>; // overload 1
export declare const withRefresh: <A extends Atom<any>>(self: A, duration: Duration.Input): WithoutSerializable<A>; // overload 2
export declare const withServerValue: <A extends Atom<any>>(read: (get: <A>(atom: Atom<A>) => A) => Type<A>): (self: A) => A; // overload 1
export declare const withServerValue: <A extends Atom<any>>(self: A, read: (get: <A>(atom: Atom<A>) => A) => Type<A>): A; // overload 2
export declare const withServerValueInitial: <A extends Atom<AsyncResult.AsyncResult<any, any>>>(self: A): A;
export declare const writable: <R, W>(read: (get: Context) => R, write: (ctx: WriteContext<R>, value: W) => void, refresh?: (f: <A>(atom: Atom<A>) => void) => void): Writable<R, W>;
```

## Other Exports (Non-Function)

- `Atom` (interface)
- `AtomResultFn` (interface)
- `AtomRuntime` (interface)
- `Context` (interface)
- `defaultMemoMap` (variable)
- `Failure` (type)
- `FnContext` (interface)
- `Interrupt` (type)
- `PullResult` (type)
- `PullSuccess` (type)
- `Reset` (type)
- `RuntimeFactory` (interface)
- `Serializable` (interface)
- `SerializableTypeId` (type)
- `ServerValueTypeId` (variable)
- `Success` (type)
- `Type` (type)
- `TypeId` (type)
- `windowFocusSignal` (variable)
- `WithoutSerializable` (type)
- `Writable` (interface)
- `WritableTypeId` (type)
- `WriteContext` (interface)
