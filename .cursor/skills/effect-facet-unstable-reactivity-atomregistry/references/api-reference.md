# API Reference: effect/unstable/reactivity/AtomRegistry

- Import path: `effect/unstable/reactivity/AtomRegistry`
- Source file: `packages/effect/src/unstable/reactivity/AtomRegistry.ts`
- Function exports (callable): 8
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `batch`
- `getResult`
- `isAtomRegistry`
- `layerOptions`
- `make`
- `mount`
- `toStream`
- `toStreamResult`

## All Function Signatures

```ts
export declare const batch: (f: () => void): void;
export declare const getResult: <A, E>(atom: Atom.Atom<Result.AsyncResult<A, E>>, options?: { readonly suspendOnWaiting?: boolean | undefined; }): (self: AtomRegistry) => Effect.Effect<A, E>; // overload 1
export declare const getResult: <A, E>(self: AtomRegistry, atom: Atom.Atom<Result.AsyncResult<A, E>>, options?: { readonly suspendOnWaiting?: boolean | undefined; }): Effect.Effect<A, E>; // overload 2
export declare const isAtomRegistry: (u: unknown): u is AtomRegistry;
export declare const layerOptions: (options?: { readonly initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined; readonly scheduleTask?: ((f: () => void) => () => void) | undefined; readonly timeoutResolution?: number | undefined; readonly defaultIdleTTL?: number | undefined; }): Layer.Layer<AtomRegistry>;
export declare const make: (options?: { readonly initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined; readonly scheduleTask?: ((f: () => void) => () => void) | undefined; readonly timeoutResolution?: number | undefined; readonly defaultIdleTTL?: number | undefined; } | undefined): AtomRegistry;
export declare const mount: <A>(atom: Atom.Atom<A>): (self: AtomRegistry) => Effect.Effect<void, never, Scope.Scope>; // overload 1
export declare const mount: <A>(self: AtomRegistry, atom: Atom.Atom<A>): Effect.Effect<void, never, Scope.Scope>; // overload 2
export declare const toStream: <A>(atom: Atom.Atom<A>): (self: AtomRegistry) => Stream.Stream<A>; // overload 1
export declare const toStream: <A>(self: AtomRegistry, atom: Atom.Atom<A>): Stream.Stream<A>; // overload 2
export declare const toStreamResult: <A, E>(atom: Atom.Atom<Result.AsyncResult<A, E>>): (self: AtomRegistry) => Stream.Stream<A, E>; // overload 1
export declare const toStreamResult: <A, E>(self: AtomRegistry, atom: Atom.Atom<Result.AsyncResult<A, E>>): Stream.Stream<A, E>; // overload 2
```

## Other Exports (Non-Function)

- `AtomRegistry` (interface)
- `BatchPhase` (type)
- `batchState` (variable)
- `layer` (variable)
- `Node` (interface)
- `TypeId` (type)
