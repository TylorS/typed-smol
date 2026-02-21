# API Reference: effect/unstable/workers/Transferable

- Import path: `effect/unstable/workers/Transferable`
- Source file: `packages/effect/src/unstable/workers/Transferable.ts`
- Function exports (callable): 4
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `addAll`
- `getterAddAll`
- `makeCollectorUnsafe`
- `schema`

## All Function Signatures

```ts
export declare const addAll: (tranferables: Iterable<globalThis.Transferable>): Effect.Effect<void>;
export declare const getterAddAll: <A>(f: (_: A) => Iterable<globalThis.Transferable>): Getter.Getter<A, A>;
export declare const makeCollectorUnsafe: (): Collector["Service"];
export declare const schema: <S extends Schema.Top>(f: (_: S["Encoded"]) => Iterable<globalThis.Transferable>): (self: S) => Transferable<S>; // overload 1
export declare const schema: <S extends Schema.Top>(self: S, f: (_: S["Encoded"]) => Iterable<globalThis.Transferable>): Transferable<S>; // overload 2
```

## Other Exports (Non-Function)

- `Collector` (class)
- `ImageData` (variable)
- `makeCollector` (variable)
- `MessagePort` (variable)
- `Transferable` (interface)
- `Uint8Array` (variable)
