# API Reference: effect/Redacted

- Import path: `effect/Redacted`
- Source file: `packages/effect/src/Redacted.ts`
- Function exports (callable): 5
- Non-function exports: 1

## Purpose

The Redacted module provides functionality for handling sensitive information securely within your application. By using the `Redacted` data type, you can ensure that sensitive values are not accidentally exposed in logs or error messages.

## Key Function Exports

- `isRedacted`
- `make`
- `makeEquivalence`
- `value`
- `wipeUnsafe`

## All Function Signatures

```ts
export declare const isRedacted: (u: unknown): u is Redacted<unknown>;
export declare const make: <T>(value: T, options?: { readonly label?: string | undefined; }): Redacted<T>;
export declare const makeEquivalence: <A>(isEquivalent: Equivalence.Equivalence<A>): Equivalence.Equivalence<Redacted<A>>;
export declare const value: <T>(self: Redacted<T>): T;
export declare const wipeUnsafe: <T>(self: Redacted<T>): boolean;
```

## Other Exports (Non-Function)

- `Redacted` (interface)
