# API Reference: effect/unstable/reactivity/AtomRef

- Import path: `effect/unstable/reactivity/AtomRef`
- Source file: `packages/effect/src/unstable/reactivity/AtomRef.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `collection`
- `make`

## All Function Signatures

```ts
export declare const collection: <A>(items: Iterable<A>): Collection<A>;
export declare const make: <A>(value: A): AtomRef<A>;
```

## Other Exports (Non-Function)

- `AtomRef` (interface)
- `Collection` (interface)
- `ReadonlyRef` (interface)
- `TypeId` (type)
