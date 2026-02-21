# API Reference: effect/unstable/reactivity/Hydration

- Import path: `effect/unstable/reactivity/Hydration`
- Source file: `packages/effect/src/unstable/reactivity/Hydration.ts`
- Function exports (callable): 3
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `dehydrate`
- `hydrate`
- `toValues`

## All Function Signatures

```ts
export declare const dehydrate: (registry: AtomRegistry.AtomRegistry, options?: { readonly encodeInitialAs?: "ignore" | "promise" | "value-only" | undefined; }): Array<DehydratedAtom>;
export declare const hydrate: (registry: AtomRegistry.AtomRegistry, dehydratedState: Iterable<DehydratedAtom>): void;
export declare const toValues: (state: ReadonlyArray<DehydratedAtom>): Array<DehydratedAtomValue>;
```

## Other Exports (Non-Function)

- `DehydratedAtom` (interface)
- `DehydratedAtomValue` (interface)
