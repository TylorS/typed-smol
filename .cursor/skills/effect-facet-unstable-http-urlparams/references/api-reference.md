# API Reference: effect/unstable/http/UrlParams

- Import path: `effect/unstable/http/UrlParams`
- Source file: `packages/effect/src/unstable/http/UrlParams.ts`
- Function exports (callable): 18
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `append`
- `appendAll`
- `Equivalence`
- `fromInput`
- `getAll`
- `getFirst`
- `getLast`
- `isUrlParams`
- `make`
- `makeUrl`
- `remove`
- `schemaJsonField`
- `set`
- `setAll`
- `toReadonlyRecord`
- `toRecord`
- `toString`
- `transform`

## All Function Signatures

```ts
export declare const append: (key: string, value: Coercible): (self: UrlParams) => UrlParams; // overload 1
export declare const append: (self: UrlParams, key: string, value: Coercible): UrlParams; // overload 2
export declare const appendAll: (input: Input): (self: UrlParams) => UrlParams; // overload 1
export declare const appendAll: (self: UrlParams, input: Input): UrlParams; // overload 2
export declare const Equivalence: (self: UrlParams, that: UrlParams): boolean;
export declare const fromInput: (input: Input): UrlParams;
export declare const getAll: (key: string): (self: UrlParams) => ReadonlyArray<string>; // overload 1
export declare const getAll: (self: UrlParams, key: string): ReadonlyArray<string>; // overload 2
export declare const getFirst: (key: string): (self: UrlParams) => string | undefined; // overload 1
export declare const getFirst: (self: UrlParams, key: string): string | undefined; // overload 2
export declare const getLast: (key: string): (self: UrlParams) => string | undefined; // overload 1
export declare const getLast: (self: UrlParams, key: string): string | undefined; // overload 2
export declare const isUrlParams: (u: unknown): u is UrlParams;
export declare const make: (params: ReadonlyArray<readonly [string, string]>): UrlParams;
export declare const makeUrl: (url: string, params: UrlParams, hash: string | undefined): Result.Result<URL, UrlParamsError>;
export declare const remove: (key: string): (self: UrlParams) => UrlParams; // overload 1
export declare const remove: (self: UrlParams, key: string): UrlParams; // overload 2
export declare const schemaJsonField: (field: string): schemaJsonField;
export declare const set: (key: string, value: Coercible): (self: UrlParams) => UrlParams; // overload 1
export declare const set: (self: UrlParams, key: string, value: Coercible): UrlParams; // overload 2
export declare const setAll: (input: Input): (self: UrlParams) => UrlParams; // overload 1
export declare const setAll: (self: UrlParams, input: Input): UrlParams; // overload 2
export declare const toReadonlyRecord: (self: UrlParams): ReadonlyRecord<string, string | Arr.NonEmptyReadonlyArray<string>>;
export declare const toRecord: (self: UrlParams): Record<string, string | Arr.NonEmptyArray<string>>;
export declare const toString: (self: UrlParams): string;
export declare const transform: (f: (params: UrlParams["params"]) => UrlParams["params"]): (self: UrlParams) => UrlParams; // overload 1
export declare const transform: (self: UrlParams, f: (params: UrlParams["params"]) => UrlParams["params"]): UrlParams; // overload 2
```

## Other Exports (Non-Function)

- `Coercible` (type)
- `CoercibleRecord` (interface)
- `empty` (variable)
- `Input` (type)
- `schemaRecord` (interface)
- `UrlParams` (interface)
- `UrlParamsError` (class)
- `UrlParamsSchema` (interface)
