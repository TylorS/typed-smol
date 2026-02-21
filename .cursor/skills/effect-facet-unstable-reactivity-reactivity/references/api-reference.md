# API Reference: effect/unstable/reactivity/Reactivity

- Import path: `effect/unstable/reactivity/Reactivity`
- Source file: `packages/effect/src/unstable/reactivity/Reactivity.ts`
- Function exports (callable): 4
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `invalidate`
- `mutation`
- `query`
- `stream`

## All Function Signatures

```ts
export declare const invalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Effect.Effect<void, never, Reactivity>;
export declare const mutation: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | Reactivity>; // overload 1
export declare const mutation: <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Effect.Effect<A, E, R | Reactivity>; // overload 2
export declare const query: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope | Reactivity>; // overload 1
export declare const query: <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope | Reactivity>; // overload 2
export declare const stream: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Stream.Stream<A, E, Exclude<R, Scope.Scope> | Reactivity>; // overload 1
export declare const stream: <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Stream.Stream<A, E, Exclude<R, Scope.Scope> | Reactivity>; // overload 2
```

## Other Exports (Non-Function)

- `layer` (variable)
- `make` (variable)
- `Reactivity` (class)
