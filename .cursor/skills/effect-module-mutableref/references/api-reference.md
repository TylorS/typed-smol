# API Reference: effect/MutableRef

- Import path: `effect/MutableRef`
- Source file: `packages/effect/src/MutableRef.ts`
- Function exports (callable): 16
- Non-function exports: 1

## Purpose

MutableRef provides a mutable reference container that allows safe mutation of values in functional programming contexts. It serves as a bridge between functional and imperative programming paradigms, offering atomic operations for state management.

## Key Function Exports

- `compareAndSet`
- `decrement`
- `decrementAndGet`
- `get`
- `getAndDecrement`
- `getAndIncrement`
- `getAndSet`
- `getAndUpdate`
- `increment`
- `incrementAndGet`
- `make`
- `set`
- `setAndGet`
- `toggle`
- `update`
- `updateAndGet`

## All Function Signatures

```ts
export declare const compareAndSet: <T>(oldValue: T, newValue: T): (self: MutableRef<T>) => boolean; // overload 1
export declare const compareAndSet: <T>(self: MutableRef<T>, oldValue: T, newValue: T): boolean; // overload 2
export declare const decrement: (self: MutableRef<number>): MutableRef<number>;
export declare const decrementAndGet: (self: MutableRef<number>): number;
export declare const get: <T>(self: MutableRef<T>): T;
export declare const getAndDecrement: (self: MutableRef<number>): number;
export declare const getAndIncrement: (self: MutableRef<number>): number;
export declare const getAndSet: <T>(value: T): (self: MutableRef<T>) => T; // overload 1
export declare const getAndSet: <T>(self: MutableRef<T>, value: T): T; // overload 2
export declare const getAndUpdate: <T>(f: (value: T) => T): (self: MutableRef<T>) => T; // overload 1
export declare const getAndUpdate: <T>(self: MutableRef<T>, f: (value: T) => T): T; // overload 2
export declare const increment: (self: MutableRef<number>): MutableRef<number>;
export declare const incrementAndGet: (self: MutableRef<number>): number;
export declare const make: <T>(value: T): MutableRef<T>;
export declare const set: <T>(value: T): (self: MutableRef<T>) => MutableRef<T>; // overload 1
export declare const set: <T>(self: MutableRef<T>, value: T): MutableRef<T>; // overload 2
export declare const setAndGet: <T>(value: T): (self: MutableRef<T>) => T; // overload 1
export declare const setAndGet: <T>(self: MutableRef<T>, value: T): T; // overload 2
export declare const toggle: (self: MutableRef<boolean>): MutableRef<boolean>;
export declare const update: <T>(f: (value: T) => T): (self: MutableRef<T>) => MutableRef<T>; // overload 1
export declare const update: <T>(self: MutableRef<T>, f: (value: T) => T): MutableRef<T>; // overload 2
export declare const updateAndGet: <T>(f: (value: T) => T): (self: MutableRef<T>) => T; // overload 1
export declare const updateAndGet: <T>(self: MutableRef<T>, f: (value: T) => T): T; // overload 2
```

## Other Exports (Non-Function)

- `MutableRef` (interface)
