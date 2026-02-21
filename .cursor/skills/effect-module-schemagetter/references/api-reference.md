# API Reference: effect/SchemaGetter

- Import path: `effect/SchemaGetter`
- Source file: `packages/effect/src/SchemaGetter.ts`
- Function exports (callable): 48
- Non-function exports: 1

## Purpose

Composable transformation primitives for the Effect Schema system.

## Key Function Exports

- `BigInt`
- `Boolean`
- `camelToSnake`
- `capitalize`
- `checkEffect`
- `collectBracketPathEntries`
- `Date`
- `dateTimeUtcFromInput`
- `decodeBase64`
- `decodeBase64String`
- `decodeBase64Url`
- `decodeBase64UrlString`
- `decodeFormData`
- `decodeHex`
- `decodeHexString`
- `decodeURLSearchParams`
- `encodeBase64`
- `encodeBase64Url`

## All Function Signatures

```ts
export declare const BigInt: <E extends string | number | bigint | boolean>(): Getter<bigint, E>;
export declare const Boolean: <E>(): Getter<boolean, E>;
export declare const camelToSnake: <E extends string>(): Getter<string, E>;
export declare const capitalize: <E extends string>(): Getter<string, E>;
export declare const checkEffect: <T, R = never>(f: (input: T, options: AST.ParseOptions) => Effect.Effect<undefined | boolean | string | Issue.Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }, never, R>): Getter<T, T, R>;
export declare const collectBracketPathEntries: <A>(isLeaf: (value: unknown) => value is A): (input: object) => Array<[bracketPath: string, value: A]>;
export declare const Date: <E extends string | number | Date>(): Getter<Date, E>;
export declare const dateTimeUtcFromInput: <E extends DateTime.DateTime.Input>(): Getter<DateTime.Utc, E>;
export declare const decodeBase64: <E extends string>(): Getter<Uint8Array, E>;
export declare const decodeBase64String: <E extends string>(): Getter<string, E>;
export declare const decodeBase64Url: <E extends string>(): Getter<Uint8Array, E>;
export declare const decodeBase64UrlString: <E extends string>(): Getter<string, E>;
export declare const decodeFormData: (): Getter<Schema.TreeObject<string | Blob>, FormData>;
export declare const decodeHex: <E extends string>(): Getter<Uint8Array, E>;
export declare const decodeHexString: <E extends string>(): Getter<string, E>;
export declare const decodeURLSearchParams: (): Getter<Schema.TreeObject<string>, URLSearchParams>;
export declare const encodeBase64: <E extends Uint8Array | string>(): Getter<string, E>;
export declare const encodeBase64Url: <E extends Uint8Array | string>(): Getter<string, E>;
export declare const encodeFormData: (): Getter<FormData, unknown>;
export declare const encodeHex: <E extends Uint8Array | string>(): Getter<string, E>;
export declare const encodeURLSearchParams: (): Getter<URLSearchParams, unknown>;
export declare const fail: <T, E>(f: (oe: Option.Option<E>) => Issue.Issue): Getter<T, E>;
export declare const forbidden: <T, E>(message: (oe: Option.Option<E>) => string): Getter<T, E>;
export declare const joinKeyValue: <E extends Record<PropertyKey, string>>(options?: { readonly separator?: string | undefined; readonly keyValueSeparator?: string | undefined; }): Getter<string, E>;
export declare const makeTreeRecord: <A>(bracketPathEntries: ReadonlyArray<readonly [bracketPath: string, value: A]>): Schema.TreeObject<A>;
export declare const Number: <E>(): Getter<number, E>;
export declare const omit: <T>(): Getter<never, T>;
export declare const onNone: <T, E extends T = T, R = never>(f: (options: AST.ParseOptions) => Effect.Effect<Option.Option<T>, Issue.Issue, R>): Getter<T, E, R>;
export declare const onSome: <T, E, R = never>(f: (e: E, options: AST.ParseOptions) => Effect.Effect<Option.Option<T>, Issue.Issue, R>): Getter<T, E, R>;
export declare const parseJson: <E extends string>(): Getter<Schema.MutableJson, E>; // overload 1
export declare const parseJson: <E extends string>(options: ParseJsonOptions): Getter<unknown, E>; // overload 2
export declare const passthrough: <T, E>(options: { readonly strict: false; }): Getter<T, E>; // overload 1
export declare const passthrough: <T>(): Getter<T, T>; // overload 2
export declare const passthroughSubtype: <T, E extends T>(): Getter<T, E>;
export declare const passthroughSupertype: <T extends E, E>(): Getter<T, E>;
export declare const required: <T, E extends T = T>(annotations?: Schema.Annotations.Key<T>): Getter<T, E>;
export declare const snakeToCamel: <E extends string>(): Getter<string, E>;
export declare const split: <E extends string>(options?: { readonly separator?: string | undefined; }): Getter<ReadonlyArray<string>, E>;
export declare const splitKeyValue: <E extends string>(options?: { readonly separator?: string | undefined; readonly keyValueSeparator?: string | undefined; }): Getter<Record<string, string>, E>;
export declare const String: <E>(): Getter<string, E>;
export declare const stringifyJson: (options?: StringifyJsonOptions): Getter<string, unknown>;
export declare const succeed: <const T, E>(t: T): Getter<T, E>;
export declare const toLowerCase: <E extends string>(): Getter<string, E>;
export declare const toUpperCase: <E extends string>(): Getter<string, E>;
export declare const transform: <T, E>(f: (e: E) => T): Getter<T, E>;
export declare const transformOptional: <T, E>(f: (oe: Option.Option<E>) => Option.Option<T>): Getter<T, E>;
export declare const transformOrFail: <T, E, R = never>(f: (e: E, options: AST.ParseOptions) => Effect.Effect<T, Issue.Issue, R>): Getter<T, E, R>;
export declare const trim: <E extends string>(): Getter<string, E>;
export declare const uncapitalize: <E extends string>(): Getter<string, E>;
export declare const withDefault: <T>(defaultValue: () => T): Getter<T, T | undefined>;
```

## Other Exports (Non-Function)

- `Getter` (class)
