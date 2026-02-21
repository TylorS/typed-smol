# API Reference: effect/Predicate#guards

- Import path: `effect/Predicate#guards`
- Source file: `packages/effect/src/Predicate.ts`
- Thematic facet: `guards`
- Function exports (callable): 33
- Non-function exports: 2

## Purpose

Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## Key Function Exports

- `hasProperty`
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
- `isNullish`
- `isNumber`
- `isObject`
- `isObjectKeyword`
- `isObjectOrArray`

## All Function Signatures

```ts
export declare const hasProperty: <P extends PropertyKey>(property: P): (self: unknown) => self is { [K in P]: unknown; }; // overload 1
export declare const hasProperty: <P extends PropertyKey>(self: unknown, property: P): self is { [K in P]: unknown; }; // overload 2
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
```

## Other Exports (Non-Function)

- `Predicate` (interface)
- `PredicateTypeLambda` (interface)
