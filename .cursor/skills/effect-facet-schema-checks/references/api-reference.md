# API Reference: effect/Schema#checks

- Import path: `effect/Schema#checks`
- Source file: `packages/effect/src/Schema.ts`
- Thematic facet: `checks`
- Function exports (callable): 75
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `asserts`
- `check`
- `decodePromise`
- `decodeUnknownPromise`
- `encodePromise`
- `encodeUnknownPromise`
- `isBase64`
- `isBase64Url`
- `isBetween`
- `isBetweenBigDecimal`
- `isBetweenBigInt`
- `isBetweenDate`
- `isCapitalized`
- `isDateValid`
- `isEndsWith`
- `isFinite`
- `isGreaterThan`
- `isGreaterThanBigDecimal`

## All Function Signatures

```ts
export declare const asserts: <S extends Top & { readonly DecodingServices: never; }>(schema: S): <I>(input: I) => asserts input is I & S["Type"];
export declare const check: <S extends Top>(checks_0: AST.Check<S["Type"]>, ...checks: AST.Check<S["Type"]>[]): (self: S) => S["~rebuild.out"];
export declare const decodePromise: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const decodeUnknownPromise: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const encodePromise: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const encodeUnknownPromise: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const isBase64: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isBase64Url: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isBetween: (options: { readonly minimum: number; readonly maximum: number; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isBetweenBigDecimal: (options: { readonly minimum: BigDecimal_.BigDecimal; readonly maximum: BigDecimal_.BigDecimal; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isBetweenBigInt: (options: { readonly minimum: bigint; readonly maximum: bigint; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isBetweenDate: (options: { readonly minimum: globalThis.Date; readonly maximum: globalThis.Date; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isCapitalized: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isDateValid: (annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isEndsWith: (endsWith: string, annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isFinite: (annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isGreaterThan: (exclusiveMinimum: number, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isGreaterThanBigDecimal: (exclusiveMinimum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isGreaterThanBigInt: (exclusiveMinimum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isGreaterThanDate: (exclusiveMinimum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isGreaterThanOrEqualTo: (minimum: number, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isGreaterThanOrEqualToBigDecimal: (minimum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isGreaterThanOrEqualToBigInt: (minimum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isGreaterThanOrEqualToDate: (minimum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isIncludes: (includes: string, annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isInt: (annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isInt32: (annotations?: Annotations.Filter): AST.FilterGroup<number>;
export declare const isLengthBetween: (minimum: number, maximum: number, annotations?: Annotations.Filter): AST.Filter<{ readonly length: number; }>;
export declare const isLessThan: (exclusiveMaximum: number, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isLessThanBigDecimal: (exclusiveMaximum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isLessThanBigInt: (exclusiveMaximum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isLessThanDate: (exclusiveMaximum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isLessThanOrEqualTo: (maximum: number, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isLessThanOrEqualToBigDecimal: (maximum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isLessThanOrEqualToBigInt: (maximum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isLessThanOrEqualToDate: (maximum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isLowercased: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isMaxLength: (maxLength: number, annotations?: Annotations.Filter): AST.Filter<{ readonly length: number; }>;
export declare const isMaxProperties: (maxProperties: number, annotations?: Annotations.Filter): AST.Filter<object>;
export declare const isMaxSize: (maxSize: number, annotations?: Annotations.Filter): AST.Filter<{ readonly size: number; }>;
export declare const isMinLength: (minLength: number, annotations?: Annotations.Filter): AST.Filter<{ readonly length: number; }>;
export declare const isMinProperties: (minProperties: number, annotations?: Annotations.Filter): AST.Filter<object>;
export declare const isMinSize: (minSize: number, annotations?: Annotations.Filter): AST.Filter<{ readonly size: number; }>;
export declare const isMultipleOf: (divisor: number, annotations?: Annotations.Filter): AST.Filter<number>;
export declare const isNonEmpty: (annotations?: Annotations.Filter): AST.Filter<{ readonly length: number; }>;
export declare const isPattern: (regExp: globalThis.RegExp, annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isPropertiesLengthBetween: (minimum: number, maximum: number, annotations?: Annotations.Filter): AST.Filter<object>;
export declare const isPropertyNames: (keySchema: Top, annotations?: Annotations.Filter): AST.Filter<object>;
export declare const isSchema: (u: unknown): u is Top;
export declare const isSchemaError: (u: unknown): u is SchemaError;
export declare const isSizeBetween: (minimum: number, maximum: number, annotations?: Annotations.Filter): AST.Filter<{ readonly size: number; }>;
export declare const isStartsWith: (startsWith: string, annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isStringBigInt: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isStringFinite: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isStringSymbol: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isTrimmed: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isUint32: (annotations?: Annotations.Filter): AST.FilterGroup<number>;
export declare const isULID: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isUncapitalized: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isUnique: <T>(annotations?: Annotations.Filter): AST.Filter<readonly T[]>;
export declare const isUppercased: (annotations?: Annotations.Filter): AST.Filter<string>;
export declare const isUUID: (version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | undefined, annotations?: Annotations.Filter): AST.Filter<string>;
export declare const makeIsBetween: <T>(deriveOptions: { readonly order: Order.Order<T>; readonly annotate?: ((options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMinimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (minimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMaximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (maximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsMultipleOf: <T>(options: { readonly remainder: (input: T, divisor: T) => T; readonly zero: NoInfer<T>; readonly annotate?: ((divisor: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (divisor: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const NullishOr: <S extends Top>(self: S): NullishOr<S>;
export declare const overrideToCodecIso: <S extends Top, Iso>(to: Codec<Iso>, transformation: { readonly decode: Getter.Getter<S["Type"], Iso>; readonly encode: Getter.Getter<Iso, S["Type"]>; }): (schema: S) => overrideToCodecIso<S, Iso>;
export declare const refine: <S extends Top, T extends S["Type"]>(refinement: (value: S["Type"]) => value is T, annotations?: Annotations.Filter): (schema: S) => refine<T, S>;
export declare const toCodecIso: <S extends Top>(schema: S): Codec<S["Type"], S["Iso"]>;
export declare const toIso: <S extends Top>(schema: S): Optic_.Iso<S["Type"], S["Iso"]>;
export declare const toIsoFocus: <S extends Top>(_: S): Optic_.Iso<S["Iso"], S["Iso"]>;
export declare const toIsoSource: <S extends Top>(_: S): Optic_.Iso<S["Type"], S["Type"]>;
```

## Other Exports (Non-Function)

- `CauseIso` (type)
- `CauseReasonIso` (type)
- `ExitIso` (type)
- `HashMapIso` (type)
- `HashSetIso` (type)
- `OptionIso` (type)
- `ReadonlyMapIso` (type)
- `ReadonlySetIso` (type)
- `ResultIso` (type)
