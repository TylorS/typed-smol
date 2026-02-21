# API Reference: effect/SchemaTransformation

- Import path: `effect/SchemaTransformation`
- Source file: `packages/effect/src/SchemaTransformation.ts`
- Function exports (callable): 19
- Non-function exports: 17

## Purpose

Bidirectional transformations for the Effect Schema system.

## Key Function Exports

- `capitalize`
- `errorFromErrorJsonEncoded`
- `isTransformation`
- `make`
- `optionFromNullOr`
- `optionFromOptional`
- `optionFromOptionalKey`
- `passthrough`
- `passthroughSubtype`
- `passthroughSupertype`
- `snakeToCamel`
- `splitKeyValue`
- `toLowerCase`
- `toUpperCase`
- `transform`
- `transformOptional`
- `transformOrFail`
- `trim`

## All Function Signatures

```ts
export declare const capitalize: (): Transformation<string, string>;
export declare const errorFromErrorJsonEncoded: (options?: { readonly includeStack?: boolean | undefined; }): Transformation<Error, { message: string; name?: string; stack?: string; }>;
export declare const isTransformation: (u: unknown): u is Transformation<any, any, unknown, unknown>;
export declare const make: <T, E, RD = never, RE = never>(options: { readonly decode: Getter.Getter<T, E, RD>; readonly encode: Getter.Getter<E, T, RE>; }): Transformation<T, E, RD, RE>;
export declare const optionFromNullOr: <T>(): Transformation<Option.Option<T>, T | null>;
export declare const optionFromOptional: <T>(): Transformation<Option.Option<T>, T | undefined>;
export declare const optionFromOptionalKey: <T>(): Transformation<Option.Option<T>, T>;
export declare const passthrough: <T, E>(options: { readonly strict: false; }): Transformation<T, E>; // overload 1
export declare const passthrough: <T>(): Transformation<T, T>; // overload 2
export declare const passthroughSubtype: <T, E extends T>(): Transformation<T, E>;
export declare const passthroughSupertype: <T extends E, E>(): Transformation<T, E>;
export declare const snakeToCamel: (): Transformation<string, string>;
export declare const splitKeyValue: (options?: { readonly separator?: string | undefined; readonly keyValueSeparator?: string | undefined; }): Transformation<Record<string, string>, string>;
export declare const toLowerCase: (): Transformation<string, string>;
export declare const toUpperCase: (): Transformation<string, string>;
export declare const transform: <T, E>(options: { readonly decode: (input: E) => T; readonly encode: (input: T) => E; }): Transformation<T, E>;
export declare const transformOptional: <T, E>(options: { readonly decode: (input: Option.Option<E>) => Option.Option<T>; readonly encode: (input: Option.Option<T>) => Option.Option<E>; }): Transformation<T, E>;
export declare const transformOrFail: <T, E, RD = never, RE = never>(options: { readonly decode: (e: E, options: AST.ParseOptions) => Effect.Effect<T, Issue.Issue, RD>; readonly encode: (t: T, options: AST.ParseOptions) => Effect.Effect<E, Issue.Issue, RE>; }): Transformation<T, E, RD, RE>;
export declare const trim: (): Transformation<string, string>;
export declare const uncapitalize: (): Transformation<string, string>;
```

## Other Exports (Non-Function)

- `bigDecimalFromString` (variable)
- `bigintFromString` (variable)
- `dateTimeUtcFromString` (variable)
- `dateTimeZonedFromString` (variable)
- `durationFromMillis` (variable)
- `durationFromNanos` (variable)
- `fromFormData` (variable)
- `fromJsonString` (variable)
- `fromURLSearchParams` (variable)
- `Middleware` (class)
- `numberFromString` (variable)
- `timeZoneFromString` (variable)
- `timeZoneNamedFromString` (variable)
- `timeZoneOffsetFromNumber` (variable)
- `Transformation` (class)
- `uint8ArrayFromBase64String` (variable)
- `urlFromString` (variable)
