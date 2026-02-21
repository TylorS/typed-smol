# API Reference: effect/Combiner

- Import path: `effect/Combiner`
- Source file: `packages/effect/src/Combiner.ts`
- Function exports (callable): 8
- Non-function exports: 1

## Purpose

A module for combining two values of the same type into one.

## Key Function Exports

- `constant`
- `first`
- `flip`
- `intercalate`
- `last`
- `make`
- `max`
- `min`

## All Function Signatures

```ts
export declare const constant: <A>(a: A): Combiner<A>;
export declare const first: <A>(): Combiner<A>;
export declare const flip: <A>(combiner: Combiner<A>): Combiner<A>;
export declare const intercalate: <A>(middle: A): (combiner: Combiner<A>) => Combiner<A>;
export declare const last: <A>(): Combiner<A>;
export declare const make: <A>(combine: (self: A, that: A) => A): Combiner<A>;
export declare const max: <A>(order: Order.Order<A>): Combiner<A>;
export declare const min: <A>(order: Order.Order<A>): Combiner<A>;
```

## Other Exports (Non-Function)

- `Combiner` (interface)
