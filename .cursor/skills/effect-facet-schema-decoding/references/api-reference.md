# API Reference: effect/Schema#decoding

- Import path: `effect/Schema#decoding`
- Source file: `packages/effect/src/Schema.ts`
- Thematic facet: `decoding`
- Function exports (callable): 21
- Non-function exports: 14

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decode`
- `decodeEffect`
- `decodeExit`
- `decodeOption`
- `decodePromise`
- `decodeSync`
- `decodeTo`
- `decodeUnknownEffect`
- `decodeUnknownExit`
- `decodeUnknownOption`
- `decodeUnknownPromise`
- `decodeUnknownSync`
- `fromBrand`
- `fromFormData`
- `fromJsonString`
- `fromURLSearchParams`
- `OptionFromNullOr`
- `OptionFromOptional`

## All Function Signatures

```ts
export declare const decode: <S extends Top, RD = never, RE = never>(transformation: { readonly decode: Getter.Getter<S["Type"], S["Type"], RD>; readonly encode: Getter.Getter<S["Type"], S["Type"], RE>; }): (self: S) => decodeTo<toType<S>, S, RD, RE>;
export declare const decodeEffect: <S extends Top>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Effect.Effect<S["Type"], SchemaError, S["DecodingServices"]>;
export declare const decodeExit: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Exit_.Exit<S["Type"], SchemaError>;
export declare const decodeOption: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Option_.Option<S["Type"]>;
export declare const decodePromise: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const decodeSync: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => S["Type"];
export declare const decodeTo: <To extends Top>(to: To): <From extends Top>(from: From) => compose<To, From>; // overload 1
export declare const decodeTo: <To extends Top, From extends Top, RD = never, RE = never>(to: To, transformation: { readonly decode: Getter.Getter<NoInfer<To["Encoded"]>, NoInfer<From["Type"]>, RD>; readonly encode: Getter.Getter<NoInfer<From["Type"]>, NoInfer<To["Encoded"]>, RE>; }): (from: From) => decodeTo<To, From, RD, RE>; // overload 2
export declare const decodeUnknownEffect: <S extends Top>(schema: S): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Type"], SchemaError, S["DecodingServices"]>;
export declare const decodeUnknownExit: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Exit_.Exit<S["Type"], SchemaError>;
export declare const decodeUnknownOption: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Option_.Option<S["Type"]>;
export declare const decodeUnknownPromise: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const decodeUnknownSync: <S extends Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => S["Type"];
export declare const fromBrand: <A extends Brand.Brand<any>>(identifier: string, ctor: Brand.Constructor<A>): <S extends Top & { readonly "Type": Brand.Brand.Unbranded<A>; }>(self: S) => brand<S["~rebuild.out"], Brand.Brand.Keys<A>>;
export declare const fromFormData: <S extends Top>(schema: S): fromFormData<S>;
export declare const fromJsonString: <S extends Top>(schema: S): fromJsonString<S>;
export declare const fromURLSearchParams: <S extends Top>(schema: S): fromURLSearchParams<S>;
export declare const OptionFromNullOr: <S extends Top>(schema: S): OptionFromNullOr<S>;
export declare const OptionFromOptional: <S extends Top>(schema: S): OptionFromOptional<S>;
export declare const OptionFromOptionalKey: <S extends Top>(schema: S): OptionFromOptionalKey<S>;
export declare const RedactedFromValue: <S extends Top>(value: S, options?: { readonly label?: string | undefined; }): RedactedFromValue<S>;
export declare const TemplateLiteralParser: <const Parts extends TemplateLiteral.Parts>(parts: Parts): TemplateLiteralParser<Parts>;
```

## Other Exports (Non-Function)

- `BooleanFromBit` (interface)
- `DateTimeUtcFromDate` (interface)
- `DateTimeUtcFromMillis` (interface)
- `DateTimeUtcFromString` (interface)
- `Decoder` (interface)
- `DurationFromMillis` (interface)
- `DurationFromNanos` (interface)
- `FiniteFromString` (interface)
- `NumberFromString` (interface)
- `Uint8ArrayFromBase64` (interface)
- `Uint8ArrayFromBase64Url` (interface)
- `Uint8ArrayFromHex` (interface)
- `UnknownFromJsonString` (interface)
- `URLFromString` (interface)
