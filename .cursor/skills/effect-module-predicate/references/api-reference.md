# API Reference: effect/Predicate

- Import path: `effect/Predicate`
- Source file: `packages/effect/src/Predicate.ts`
- Function exports (callable): 47
- Non-function exports: 3

## Purpose

Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## Key Function Exports

- `and`
- `compose`
- `eqv`
- `every`
- `hasProperty`
- `implies`
- `isBigInt`
- `isBoolean`
- `isDate`
- `isError`
- `isFunction`
- `isIterable`
- `isMap`
- `isNever`
- `isNotNull`
- `isNotNullish`
- `isNotUndefined`
- `isNull`

## All Function Signatures

```ts
export declare const and: <A, C extends A>(that: Refinement<A, C>): <B extends A>(self: Refinement<A, B>) => Refinement<A, B & C>; // overload 1
export declare const and: <A, B extends A, C extends A>(self: Refinement<A, B>, that: Refinement<A, C>): Refinement<A, B & C>; // overload 2
export declare const and: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 3
export declare const and: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 4
export declare const compose: <A, B extends A, C extends B>(bc: Refinement<B, C>): (ab: Refinement<A, B>) => Refinement<A, C>; // overload 1
export declare const compose: <A, B extends A>(bc: Predicate<NoInfer<B>>): (ab: Refinement<A, B>) => Refinement<A, B>; // overload 2
export declare const compose: <A, B extends A, C extends B>(ab: Refinement<A, B>, bc: Refinement<B, C>): Refinement<A, C>; // overload 3
export declare const compose: <A, B extends A>(ab: Refinement<A, B>, bc: Predicate<NoInfer<B>>): Refinement<A, B>; // overload 4
export declare const eqv: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 1
export declare const eqv: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 2
export declare const every: <A>(collection: Iterable<Predicate<A>>): Predicate<A>;
export declare const hasProperty: <P extends PropertyKey>(property: P): (self: unknown) => self is { [K in P]: unknown; }; // overload 1
export declare const hasProperty: <P extends PropertyKey>(self: unknown, property: P): self is { [K in P]: unknown; }; // overload 2
export declare const implies: <A>(consequent: Predicate<A>): (antecedent: Predicate<A>) => Predicate<A>; // overload 1
export declare const implies: <A>(antecedent: Predicate<A>, consequent: Predicate<A>): Predicate<A>; // overload 2
export declare const isBigInt: (input: unknown): input is bigint;
export declare const isBoolean: (input: unknown): input is boolean;
export declare const isDate: (input: unknown): input is Date;
export declare const isError: (input: unknown): input is Error;
export declare const isFunction: (input: unknown): input is Function;
export declare const isIterable: (input: unknown): input is Iterable<unknown>;
export declare const isMap: (input: unknown): input is Map<unknown, unknown>;
export declare const isNever: (_: unknown): _ is never;
export declare const isNotNull: <A>(input: A): input is Exclude<A, null>;
export declare const isNotNullish: <A>(input: A): input is NonNullable<A>;
export declare const isNotUndefined: <A>(input: A): input is Exclude<A, undefined>;
export declare const isNull: (input: unknown): input is null;
export declare const isNullish: <A>(input: A): input is Extract<A, null | undefined>;
export declare const isNumber: (input: unknown): input is number;
export declare const isObject: (input: unknown): input is { [x: PropertyKey]: unknown; };
export declare const isObjectKeyword: (input: unknown): input is object;
export declare const isObjectOrArray: (input: unknown): input is { [x: PropertyKey]: unknown; } | Array<unknown>;
export declare const isPromise: (input: unknown): input is Promise<unknown>;
export declare const isPromiseLike: (input: unknown): input is PromiseLike<unknown>;
export declare const isPropertyKey: (u: unknown): u is PropertyKey;
export declare const isReadonlyObject: (input: unknown): input is { readonly [x: PropertyKey]: unknown; };
export declare const isRegExp: (input: unknown): input is RegExp;
export declare const isSet: (input: unknown): input is Set<unknown>;
export declare const isString: (input: unknown): input is string;
export declare const isSymbol: (input: unknown): input is symbol;
export declare const isTagged: <K extends string>(tag: K): (self: unknown) => self is { _tag: K; }; // overload 1
export declare const isTagged: <K extends string>(self: unknown, tag: K): self is { _tag: K; }; // overload 2
export declare const isTruthy: (input: unknown): boolean;
export declare const isTupleOf: <N extends number>(n: N): <T>(self: ReadonlyArray<T>) => self is TupleOf<N, T>; // overload 1
export declare const isTupleOf: <T, N extends number>(self: ReadonlyArray<T>, n: N): self is TupleOf<N, T>; // overload 2
export declare const isTupleOfAtLeast: <N extends number>(n: N): <T>(self: ReadonlyArray<T>) => self is TupleOfAtLeast<N, T>; // overload 1
export declare const isTupleOfAtLeast: <T, N extends number>(self: ReadonlyArray<T>, n: N): self is TupleOfAtLeast<N, T>; // overload 2
export declare const isUint8Array: (input: unknown): input is Uint8Array;
export declare const isUndefined: (input: unknown): input is undefined;
export declare const isUnknown: (_: unknown): _ is unknown;
export declare const mapInput: <B, A>(f: (b: B) => A): (self: Predicate<A>) => Predicate<B>; // overload 1
export declare const mapInput: <A, B>(self: Predicate<A>, f: (b: B) => A): Predicate<B>; // overload 2
export declare const nand: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 1
export declare const nand: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 2
export declare const nor: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 1
export declare const nor: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 2
export declare const not: <A>(self: Predicate<A>): Predicate<A>;
export declare const or: <A, C extends A>(that: Refinement<A, C>): <B extends A>(self: Refinement<A, B>) => Refinement<A, B | C>; // overload 1
export declare const or: <A, B extends A, C extends A>(self: Refinement<A, B>, that: Refinement<A, C>): Refinement<A, B | C>; // overload 2
export declare const or: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 3
export declare const or: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 4
export declare const some: <A>(collection: Iterable<Predicate<A>>): Predicate<A>;
export declare const Struct: <R extends Record<string, Predicate.Any>>(fields: R): [Extract<R[keyof R], Refinement.Any>] extends [never] ? Predicate<{ readonly [K in keyof R]: Predicate.In<R[K]>; }> : Refinement<{ readonly [K in keyof R]: R[K] extends Refinement.Any ? Refinement.In<R[K]> : Predicate.In<R[K]>; }, { readonly [K in keyof R]: R[K] extends Refinement.Any ? Refinement.Out<R[K]> : Predicate.In<R[K]>; }>;
export declare const Tuple: <const T extends ReadonlyArray<Predicate.Any>>(elements: T): [Extract<T[number], Refinement.Any>] extends [never] ? Predicate<{ readonly [I in keyof T]: Predicate.In<T[I]>; }> : Refinement<{ readonly [I in keyof T]: T[I] extends Refinement.Any ? Refinement.In<T[I]> : Predicate.In<T[I]>; }, { readonly [I in keyof T]: T[I] extends Refinement.Any ? Refinement.Out<T[I]> : Predicate.In<T[I]>; }>;
export declare const xor: <A>(that: Predicate<A>): (self: Predicate<A>) => Predicate<A>; // overload 1
export declare const xor: <A>(self: Predicate<A>, that: Predicate<A>): Predicate<A>; // overload 2
```

## Other Exports (Non-Function)

- `Predicate` (interface)
- `PredicateTypeLambda` (interface)
- `Refinement` (interface)
