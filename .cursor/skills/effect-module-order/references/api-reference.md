# API Reference: effect/Order

- Import path: `effect/Order`
- Source file: `packages/effect/src/Order.ts`
- Function exports (callable): 23
- Non-function exports: 2

## Purpose

This module provides the `Order` type class for defining total orderings on types. An `Order` is a comparison function that returns `-1` (less than), `0` (equal), or `1` (greater than).

## Key Function Exports

- `alwaysEqual`
- `Array`
- `BigInt`
- `Boolean`
- `clamp`
- `combine`
- `combineAll`
- `Date`
- `flip`
- `isBetween`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThan`
- `isLessThanOrEqualTo`
- `make`
- `makeReducer`
- `mapInput`
- `max`

## All Function Signatures

```ts
export declare const alwaysEqual: <A>(): Order<A>;
export declare const Array: <A>(O: Order<A>): Order<ReadonlyArray<A>>;
export declare const BigInt: (self: bigint, that: bigint): Ordering;
export declare const Boolean: (self: boolean, that: boolean): Ordering;
export declare const clamp: <A>(O: Order<A>): { (options: { minimum: A; maximum: A; }): (self: A) => A; (self: A, options: { minimum: A; maximum: A; }): A; };
export declare const combine: <A>(that: Order<A>): (self: Order<A>) => Order<A>; // overload 1
export declare const combine: <A>(self: Order<A>, that: Order<A>): Order<A>; // overload 2
export declare const combineAll: <A>(collection: Iterable<Order<A>>): Order<A>;
export declare const Date: (self: Date, that: Date): Ordering;
export declare const flip: <A>(O: Order<A>): Order<A>;
export declare const isBetween: <A>(O: Order<A>): { (options: { minimum: A; maximum: A; }): (self: A) => boolean; (self: A, options: { minimum: A; maximum: A; }): boolean; };
export declare const isGreaterThan: <A>(O: Order<A>): { (that: A): (self: A) => boolean; (self: A, that: A): boolean; };
export declare const isGreaterThanOrEqualTo: <A>(O: Order<A>): { (that: A): (self: A) => boolean; (self: A, that: A): boolean; };
export declare const isLessThan: <A>(O: Order<A>): { (that: A): (self: A) => boolean; (self: A, that: A): boolean; };
export declare const isLessThanOrEqualTo: <A>(O: Order<A>): { (that: A): (self: A) => boolean; (self: A, that: A): boolean; };
export declare const make: <A>(compare: (self: A, that: A) => -1 | 0 | 1): Order<A>;
export declare const makeReducer: <A>(): Reducer.Reducer<Order<A>>;
export declare const mapInput: <B, A>(f: (b: B) => A): (self: Order<A>) => Order<B>; // overload 1
export declare const mapInput: <A, B>(self: Order<A>, f: (b: B) => A): Order<B>; // overload 2
export declare const max: <A>(O: Order<A>): { (that: A): (self: A) => A; (self: A, that: A): A; };
export declare const min: <A>(O: Order<A>): { (that: A): (self: A) => A; (self: A, that: A): A; };
export declare const Number: (self: number, that: number): Ordering;
export declare const String: (self: string, that: string): Ordering;
export declare const Struct: <const R extends { readonly [x: string]: Order<any>; }>(fields: R): Order<{ [K in keyof R]: [R[K]] extends [Order<infer A>] ? A : never; }>;
export declare const Tuple: <const Elements extends ReadonlyArray<Order<any>>>(elements: Elements): Order<{ readonly [I in keyof Elements]: [Elements[I]] extends [Order<infer A>] ? A : never; }>;
```

## Other Exports (Non-Function)

- `Order` (interface)
- `OrderTypeLambda` (interface)
