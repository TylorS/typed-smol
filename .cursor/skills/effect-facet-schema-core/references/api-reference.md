# API Reference: effect/Schema#core

- Import path: `effect/Schema#core`
- Source file: `packages/effect/src/Schema.ts`
- Thematic facet: `core`
- Function exports (callable): 20
- Non-function exports: 18

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `_getTagValueIfPropertyKey`
- `fromBrand`
- `fromFormData`
- `fromJsonString`
- `fromURLSearchParams`
- `HashSet`
- `make`
- `makeFilter`
- `makeFilterGroup`
- `makeIsBetween`
- `makeIsGreaterThan`
- `makeIsGreaterThanOrEqualTo`
- `makeIsLessThan`
- `makeIsLessThanOrEqualTo`
- `makeIsMultipleOf`
- `OptionFromNullOr`
- `OptionFromOptional`
- `OptionFromOptionalKey`

## All Function Signatures

```ts
export declare const _getTagValueIfPropertyKey: (tag: PropertyKey, ast: AST.Objects): PropertyKey | undefined;
export declare const fromBrand: <A extends Brand.Brand<any>>(identifier: string, ctor: Brand.Constructor<A>): <S extends Top & { readonly "Type": Brand.Brand.Unbranded<A>; }>(self: S) => brand<S["~rebuild.out"], Brand.Brand.Keys<A>>;
export declare const fromFormData: <S extends Top>(schema: S): fromFormData<S>;
export declare const fromJsonString: <S extends Top>(schema: S): fromJsonString<S>;
export declare const fromURLSearchParams: <S extends Top>(schema: S): fromURLSearchParams<S>;
export declare const HashSet: <Value extends Top>(value: Value): HashSet<Value>;
export declare const make: <S extends Top>(ast: S["ast"], options?: object): S;
export declare const makeFilter: <T>(filter: (input: T, ast: AST.AST, options: AST.ParseOptions) => undefined | boolean | string | Issue.Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }, annotations?: Annotations.Filter | undefined, abort?: boolean): AST.Filter<T>;
export declare const makeFilterGroup: <T>(checks: readonly [AST.Check<T>, ...Array<AST.Check<T>>], annotations?: Annotations.Filter | undefined): AST.FilterGroup<T>;
export declare const makeIsBetween: <T>(deriveOptions: { readonly order: Order.Order<T>; readonly annotate?: ((options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMinimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (minimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMaximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (maximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsMultipleOf: <T>(options: { readonly remainder: (input: T, divisor: T) => T; readonly zero: NoInfer<T>; readonly annotate?: ((divisor: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (divisor: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const OptionFromNullOr: <S extends Top>(schema: S): OptionFromNullOr<S>;
export declare const OptionFromOptional: <S extends Top>(schema: S): OptionFromOptional<S>;
export declare const OptionFromOptionalKey: <S extends Top>(schema: S): OptionFromOptionalKey<S>;
export declare const ReadonlySet: <Value extends Top>(value: Value): $ReadonlySet<Value>;
export declare const RedactedFromValue: <S extends Top>(value: S, options?: { readonly label?: string | undefined; }): RedactedFromValue<S>;
```

## Other Exports (Non-Function)

- `$ReadonlySet` (interface)
- `BooleanFromBit` (interface)
- `DateTimeUtcFromDate` (interface)
- `DateTimeUtcFromMillis` (interface)
- `DateTimeUtcFromString` (interface)
- `DurationFromMillis` (interface)
- `DurationFromNanos` (interface)
- `FiniteFromString` (interface)
- `HashSetIso` (type)
- `MakeOptions` (interface)
- `NumberFromString` (interface)
- `ReadonlySetIso` (type)
- `TimeZoneOffset` (interface)
- `Uint8ArrayFromBase64` (interface)
- `Uint8ArrayFromBase64Url` (interface)
- `Uint8ArrayFromHex` (interface)
- `UnknownFromJsonString` (interface)
- `URLFromString` (interface)
