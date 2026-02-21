# API Reference: effect/TxRef

- Import path: `effect/TxRef`
- Source file: `packages/effect/src/TxRef.ts`
- Function exports (callable): 6
- Non-function exports: 1

## Purpose

TxRef is a transactional value, it can be read and modified within the body of a transaction.

## Key Function Exports

- `get`
- `make`
- `makeUnsafe`
- `modify`
- `set`
- `update`

## All Function Signatures

```ts
export declare const get: <A>(self: TxRef<A>): Effect.Effect<A>;
export declare const make: <A>(initial: A): Effect.Effect<TxRef<A>, never, never>;
export declare const makeUnsafe: <A>(initial: A): TxRef<A>;
export declare const modify: <A, R>(f: (current: NoInfer<A>) => [returnValue: R, newValue: A]): (self: TxRef<A>) => Effect.Effect<R>; // overload 1
export declare const modify: <A, R>(self: TxRef<A>, f: (current: A) => [returnValue: R, newValue: A]): Effect.Effect<R>; // overload 2
export declare const set: <A>(value: A): (self: TxRef<A>) => Effect.Effect<void>; // overload 1
export declare const set: <A>(self: TxRef<A>, value: A): Effect.Effect<void>; // overload 2
export declare const update: <A>(f: (current: NoInfer<A>) => A): (self: TxRef<A>) => Effect.Effect<void>; // overload 1
export declare const update: <A>(self: TxRef<A>, f: (current: A) => A): Effect.Effect<void>; // overload 2
```

## Other Exports (Non-Function)

- `TxRef` (interface)
