# API Reference: effect/String

- Import path: `effect/String`
- Source file: `packages/effect/src/String.ts`
- Function exports (callable): 57
- Non-function exports: 6

## Purpose

This module provides utility functions and type class instances for working with the `string` type in TypeScript. It includes functions for basic string manipulation.

## Key Function Exports

- `at`
- `camelCase`
- `camelToSnake`
- `capitalize`
- `charAt`
- `charCodeAt`
- `codePointAt`
- `concat`
- `constantCase`
- `endsWith`
- `Equivalence`
- `includes`
- `indexOf`
- `isEmpty`
- `isNonEmpty`
- `isString`
- `kebabCase`
- `kebabToSnake`

## All Function Signatures

```ts
export declare const at: (index: number): (self: string) => string | undefined;
export declare const camelCase: (self: string): string;
export declare const camelToSnake: (self: string): string;
export declare const capitalize: <T extends string>(self: T): Capitalize<T>;
export declare const charAt: (index: number): (self: string) => string | undefined; // overload 1
export declare const charAt: (self: string, index: number): string | undefined; // overload 2
export declare const charCodeAt: (index: number): (self: string) => number | undefined; // overload 1
export declare const charCodeAt: (self: string, index: number): number | undefined; // overload 2
export declare const codePointAt: (index: number): (self: string) => number | undefined;
export declare const concat: <B extends string>(that: B): <A extends string>(self: A) => Concat<A, B>; // overload 1
export declare const concat: <A extends string, B extends string>(self: A, that: B): Concat<A, B>; // overload 2
export declare const constantCase: (self: string): string;
export declare const endsWith: (searchString: string, position?: number): (self: string) => boolean;
export declare const Equivalence: (self: string, that: string): boolean;
export declare const includes: (searchString: string, position?: number): (self: string) => boolean;
export declare const indexOf: (searchString: string): (self: string) => number | undefined;
export declare const isEmpty: (self: string): self is "";
export declare const isNonEmpty: (self: string): boolean;
export declare const isString: (a: unknown): a is string;
export declare const kebabCase: (self: string): string;
export declare const kebabToSnake: (self: string): string;
export declare const lastIndexOf: (searchString: string): (self: string) => number | undefined;
export declare const length: (self: string): number;
export declare const linesIterator: (self: string): LinesIterator;
export declare const linesWithSeparators: (s: string): LinesIterator;
export declare const localeCompare: (that: string, locales?: Array<string>, options?: Intl.CollatorOptions): (self: string) => Ordering.Ordering;
export declare const match: (regExp: RegExp | string): (self: string) => RegExpMatchArray | null;
export declare const matchAll: (regExp: RegExp): (self: string) => IterableIterator<RegExpMatchArray>;
export declare const noCase: (options?: { readonly splitRegExp?: RegExp | ReadonlyArray<RegExp> | undefined; readonly stripRegExp?: RegExp | ReadonlyArray<RegExp> | undefined; readonly delimiter?: string | undefined; readonly transform?: (part: string, index: number, parts: ReadonlyArray<string>) => string; }): (self: string) => string; // overload 1
export declare const noCase: (self: string, options?: { readonly splitRegExp?: RegExp | ReadonlyArray<RegExp> | undefined; readonly stripRegExp?: RegExp | ReadonlyArray<RegExp> | undefined; readonly delimiter?: string | undefined; readonly transform?: (part: string, index: number, parts: ReadonlyArray<string>) => string; }): string; // overload 2
export declare const normalize: (form?: "NFC" | "NFD" | "NFKC" | "NFKD"): (self: string) => string;
export declare const Order: (self: string, that: string): Ordering.Ordering;
export declare const padEnd: (maxLength: number, fillString?: string): (self: string) => string;
export declare const padStart: (maxLength: number, fillString?: string): (self: string) => string;
export declare const pascalCase: (self: string): string;
export declare const pascalToSnake: (self: string): string;
export declare const repeat: (count: number): (self: string) => string;
export declare const replace: (searchValue: string | RegExp, replaceValue: string): (self: string) => string;
export declare const replaceAll: (searchValue: string | RegExp, replaceValue: string): (self: string) => string;
export declare const search: (regExp: RegExp | string): (self: string) => number | undefined; // overload 1
export declare const search: (self: string, regExp: RegExp | string): number | undefined; // overload 2
export declare const slice: (start?: number, end?: number): (self: string) => string;
export declare const snakeCase: (self: string): string;
export declare const snakeToCamel: (self: string): string;
export declare const snakeToKebab: (self: string): string;
export declare const snakeToPascal: (self: string): string;
export declare const split: (separator: string | RegExp): (self: string) => NonEmptyArray<string>; // overload 1
export declare const split: (self: string, separator: string | RegExp): NonEmptyArray<string>; // overload 2
export declare const startsWith: (searchString: string, position?: number): (self: string) => boolean;
export declare const String: (value?: any): string;
export declare const stripMargin: (self: string): string;
export declare const stripMarginWith: (marginChar: string): (self: string) => string; // overload 1
export declare const stripMarginWith: (self: string, marginChar: string): string; // overload 2
export declare const substring: (start: number, end?: number): (self: string) => string;
export declare const takeLeft: (n: number): (self: string) => string; // overload 1
export declare const takeLeft: (self: string, n: number): string; // overload 2
export declare const takeRight: (n: number): (self: string) => string; // overload 1
export declare const takeRight: (self: string, n: number): string; // overload 2
export declare const toLocaleLowerCase: (locale?: string | Array<string>): (self: string) => string;
export declare const toLocaleUpperCase: (locale?: string | Array<string>): (self: string) => string;
export declare const toLowerCase: <T extends string>(self: T): Lowercase<T>;
export declare const toUpperCase: <S extends string>(self: S): Uppercase<S>;
export declare const trim: <A extends string>(self: A): Trim<A>;
export declare const trimEnd: <A extends string>(self: A): TrimEnd<A>;
export declare const trimStart: <A extends string>(self: A): TrimStart<A>;
export declare const uncapitalize: <T extends string>(self: T): Uncapitalize<T>;
```

## Other Exports (Non-Function)

- `Concat` (type)
- `empty` (variable)
- `ReducerConcat` (variable)
- `Trim` (type)
- `TrimEnd` (type)
- `TrimStart` (type)
