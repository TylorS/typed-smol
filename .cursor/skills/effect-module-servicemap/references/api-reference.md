# API Reference: effect/Context

- Import path: `effect/Context`
- Source file: `packages/effect/src/Context.ts`
- Function exports (callable): 20
- Non-function exports: 2

## Purpose

This module provides a data structure called `Context` that can be used for dependency injection in effectful programs. It is essentially a table mapping `Service`s identifiers to their implementations, and can be used to manage dependencies in a type-safe way.

## Key Function Exports

- `add`
- `addOrOmit`
- `empty`
- `get`
- `getOption`
- `getOrElse`
- `getOrUndefined`
- `getReferenceUnsafe`
- `getUnsafe`
- `isReference`
- `isService`
- `isContext`
- `make`
- `makeUnsafe`
- `merge`
- `mergeAll`
- `omit`
- `pick`

## All Function Signatures

```ts
export declare const add: <I, S>(key: Service<I, S>, service: Types.NoInfer<S>): <Services>(self: Context<Services>) => Context<Services | I>; // overload 1
export declare const add: <Services, I, S>(self: Context<Services>, key: Service<I, S>, service: Types.NoInfer<S>): Context<Services | I>; // overload 2
export declare const addOrOmit: <I, S>(key: Service<I, S>, service: Option.Option<Types.NoInfer<S>>): <Services>(self: Context<Services>) => Context<Services | I>; // overload 1
export declare const addOrOmit: <Services, I, S>(self: Context<Services>, key: Service<I, S>, service: Option.Option<Types.NoInfer<S>>): Context<Services | I>; // overload 2
export declare const empty: (): Context<never>;
export declare const get: <Services, I extends Services, S>(service: Service<I, S>): (self: Context<Services>) => S; // overload 1
export declare const get: <Services, I extends Services, S>(self: Context<Services>, service: Service<I, S>): S; // overload 2
export declare const getOption: <S, I>(service: Service<I, S>): <Services>(self: Context<Services>) => Option.Option<S>; // overload 1
export declare const getOption: <Services, S, I>(self: Context<Services>, service: Service<I, S>): Option.Option<S>; // overload 2
export declare const getOrElse: <S, I, B>(key: Service<I, S>, orElse: LazyArg<B>): <Services>(self: Context<Services>) => S | B; // overload 1
export declare const getOrElse: <Services, S, I, B>(self: Context<Services>, key: Service<I, S>, orElse: LazyArg<B>): S | B; // overload 2
export declare const getOrUndefined: <S, I>(key: Service<I, S>): <Services>(self: Context<Services>) => S | undefined; // overload 1
export declare const getOrUndefined: <Services, S, I>(self: Context<Services>, key: Service<I, S>): S | undefined; // overload 2
export declare const getReferenceUnsafe: <Services, S>(self: Context<Services>, service: Reference<S>): S;
export declare const getUnsafe: <S, I>(service: Service<I, S>): <Services>(self: Context<Services>) => S; // overload 1
export declare const getUnsafe: <Services, S, I>(self: Context<Services>, services: Service<I, S>): S; // overload 2
export declare const isReference: (u: unknown): u is Reference<any>;
export declare const isService: (u: unknown): u is Service<any, any>;
export declare const isContext: (u: unknown): u is Context<never>;
export declare const make: <I, S>(key: Service<I, S>, service: Types.NoInfer<S>): Context<I>;
export declare const makeUnsafe: <Services = never>(mapUnsafe: ReadonlyMap<string, any>): Context<Services>;
export declare const merge: <R1>(that: Context<R1>): <Services>(self: Context<Services>) => Context<R1 | Services>; // overload 1
export declare const merge: <Services, R1>(self: Context<Services>, that: Context<R1>): Context<Services | R1>; // overload 2
export declare const mergeAll: <T extends Array<unknown>>(...ctxs: { [K in keyof T]: Context<T[K]>; }): Context<T[number]>;
export declare const omit: <S extends ReadonlyArray<Service<any, any>>>(...keys: S): <Services>(self: Context<Services>) => Context<Exclude<Services, Service.Identifier<S[number]>>>;
export declare const pick: <S extends ReadonlyArray<Service<any, any>>>(...services: S): <Services>(self: Context<Services>) => Context<Services & Service.Identifier<S[number]>>;
export declare const Reference: <Service>(key: string, options: { readonly defaultValue: () => Service; }): Reference<Service>;
export declare const Service: <Identifier, Shape = Identifier>(key: string): Service<Identifier, Shape>; // overload 1
export declare const Service: <Self, Shape>(): <const Identifier extends string, E, R = Types.unassigned, Args extends ReadonlyArray<any> = never>(id: Identifier, options?: { readonly make: ((...args: Args) => Effect<Shape, E, R>) | Effect<Shape, E, R> | undefined; } | undefined) => ServiceClass<Self, Identifier, Shape> & ([Types.unassigned] extends [R] ? unknown : { readonly make: [Args] extends [never] ? Effect<Shape, E, R> : (...args: Args) => Effect<Shape, E, R>; }); // overload 2
export declare const Service: <Self>(): <const Identifier extends string, Make extends Effect<any, any, any> | ((...args: any) => Effect<any, any, any>)>(id: Identifier, options: { readonly make: Make; }) => ServiceClass<Self, Identifier, Make extends Effect<infer _A, infer _E, infer _R> | ((...args: infer _Args) => Effect<infer _A, infer _E, infer _R>) ? _A : never> & { readonly make: Make; }; // overload 3
```

## Other Exports (Non-Function)

- `ServiceClass` (interface)
- `Context` (interface)
