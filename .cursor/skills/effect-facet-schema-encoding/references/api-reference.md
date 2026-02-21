# API Reference: effect/Schema#encoding

- Import path: `effect/Schema#encoding`
- Source file: `packages/effect/src/Schema.ts`
- Thematic facet: `encoding`
- Function exports (callable): 45
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `declareConstructor`
- `encode`
- `encodeEffect`
- `encodeExit`
- `encodeKeys`
- `encodeOption`
- `encodePromise`
- `encodeSync`
- `encodeTo`
- `encodeUnknownEffect`
- `encodeUnknownExit`
- `encodeUnknownOption`
- `encodeUnknownPromise`
- `encodeUnknownSync`
- `isGreaterThanOrEqualToBigDecimal`
- `isGreaterThanOrEqualToBigInt`
- `isGreaterThanOrEqualToDate`
- `isLessThanOrEqualToBigDecimal`

## All Function Signatures

```ts
export declare const declareConstructor: <T, E = T, Iso = T>(): <const TypeParameters extends ReadonlyArray<Top>>(typeParameters: TypeParameters, run: (typeParameters: { readonly [K in keyof TypeParameters]: Codec<TypeParameters[K]["Type"], TypeParameters[K]["Encoded"]>; }) => (u: unknown, self: AST.Declaration, options: AST.ParseOptions) => Effect.Effect<T, Issue.Issue>, annotations?: Annotations.Declaration<T, TypeParameters>) => declareConstructor<T, E, TypeParameters, Iso>;
export declare const encode: <S extends Top, RD = never, RE = never>(transformation: { readonly decode: Getter.Getter<S["Encoded"], S["Encoded"], RD>; readonly encode: Getter.Getter<S["Encoded"], S["Encoded"], RE>; }): (self: S) => decodeTo<S, toEncoded<S>, RD, RE>;
export declare const encodeEffect: <S extends Top>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], SchemaError, S["EncodingServices"]>;
export declare const encodeExit: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Exit_.Exit<S["Encoded"], SchemaError>;
export declare const encodeKeys: <S extends Struct<Struct.Fields>, const M extends { readonly [K in keyof S["fields"]]?: PropertyKey; }>(mapping: M): (self: S) => decodeTo<S, Struct<{ [K in keyof S["fields"] as K extends keyof M ? M[K] extends PropertyKey ? M[K] : K : K]: toEncoded<S["fields"][K]>; }>>;
export declare const encodeOption: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Option_.Option<S["Encoded"]>;
export declare const encodePromise: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const encodeSync: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => S["Encoded"];
export declare const encodeTo: <To extends Top>(to: To): <From extends Top>(from: From) => decodeTo<From, To>; // overload 1
export declare const encodeTo: <To extends Top, From extends Top, RD = never, RE = never>(to: To, transformation: { readonly decode: Getter.Getter<NoInfer<From["Encoded"]>, NoInfer<To["Type"]>, RD>; readonly encode: Getter.Getter<NoInfer<To["Type"]>, NoInfer<From["Encoded"]>, RE>; }): (from: From) => decodeTo<From, To, RD, RE>; // overload 2
export declare const encodeUnknownEffect: <S extends Top>(schema: S): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], SchemaError, S["EncodingServices"]>;
export declare const encodeUnknownExit: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Exit_.Exit<S["Encoded"], SchemaError>;
export declare const encodeUnknownOption: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Option_.Option<S["Encoded"]>;
export declare const encodeUnknownPromise: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const encodeUnknownSync: <S extends Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => S["Encoded"];
export declare const isGreaterThanOrEqualToBigDecimal: (minimum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isGreaterThanOrEqualToBigInt: (minimum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isGreaterThanOrEqualToDate: (minimum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const isLessThanOrEqualToBigDecimal: (maximum: BigDecimal_.BigDecimal, annotations?: Annotations.Filter): AST.Filter<BigDecimal_.BigDecimal>;
export declare const isLessThanOrEqualToBigInt: (maximum: bigint, annotations?: Annotations.Filter): AST.Filter<bigint>;
export declare const isLessThanOrEqualToDate: (maximum: globalThis.Date, annotations?: Annotations.Filter): AST.Filter<globalThis.Date>;
export declare const overrideToCodecIso: <S extends Top, Iso>(to: Codec<Iso>, transformation: { readonly decode: Getter.Getter<S["Type"], Iso>; readonly encode: Getter.Getter<Iso, S["Type"]>; }): (schema: S) => overrideToCodecIso<S, Iso>;
export declare const overrideToEquivalence: <S extends Top>(toEquivalence: () => Equivalence.Equivalence<S["Type"]>): (self: S) => S["~rebuild.out"];
export declare const overrideToFormatter: <S extends Top>(toFormatter: () => Formatter<S["Type"]>): (self: S) => S["~rebuild.out"];
export declare const revealBottom: <S extends Top>(bottom: S): Bottom<S["Type"], S["Encoded"], S["DecodingServices"], S["EncodingServices"], S["ast"], S["~rebuild.out"], S["~type.make.in"], S["Iso"], S["~type.parameters"], S["~type.make"], S["~type.mutability"], S["~type.optionality"], S["~type.constructor.default"], S["~encoded.mutability"], S["~encoded.optionality"]>;
export declare const tagDefaultOmit: <Tag extends AST.LiteralValue>(literal: Tag): withDecodingDefaultKey<tag<Tag>>;
export declare const toArbitrary: <S extends Top>(schema: S): FastCheck.Arbitrary<S["Type"]>;
export declare const toArbitraryLazy: <S extends Top>(schema: S): LazyArbitrary<S["Type"]>;
export declare const toCodecIso: <S extends Top>(schema: S): Codec<S["Type"], S["Iso"]>;
export declare const toCodecJson: <T, E, RD, RE>(schema: Codec<T, E, RD, RE>): Codec<T, unknown, RD, RE>;
export declare const toCodecStringTree: <T, E, RD, RE>(schema: Codec<T, E, RD, RE>): Codec<T, StringTree, RD, RE>; // overload 1
export declare const toCodecStringTree: <T, E, RD, RE>(schema: Codec<T, E, RD, RE>, options: { readonly keepDeclarations: true; }): Codec<T, unknown, RD, RE>; // overload 2
export declare const toDifferJsonPatch: <T, E>(schema: Codec<T, E>): Differ<T, JsonPatch.JsonPatch>;
export declare const toEncoded: <S extends Top>(self: S): toEncoded<S>;
export declare const toEncoderXml: <T, E, RD, RE>(codec: Codec<T, E, RD, RE>, options?: XmlEncoderOptions): (t: T) => Effect.Effect<string, SchemaError, RE>;
export declare const toEquivalence: <T>(schema: Schema<T>): Equivalence.Equivalence<T>;
export declare const toFormatter: <T>(schema: Schema<T>, options?: { readonly onBefore?: ((ast: AST.AST, recur: (ast: AST.AST) => Formatter<any>) => Formatter<any> | undefined) | undefined; }): Formatter<T>;
export declare const toIso: <S extends Top>(schema: S): Optic_.Iso<S["Type"], S["Iso"]>;
export declare const toIsoFocus: <S extends Top>(_: S): Optic_.Iso<S["Iso"], S["Iso"]>;
export declare const toIsoSource: <S extends Top>(_: S): Optic_.Iso<S["Type"], S["Type"]>;
export declare const toJsonSchemaDocument: (schema: Top, options?: ToJsonSchemaOptions): JsonSchema.Document<"draft-2020-12">;
export declare const toRepresentation: (schema: Top): SchemaRepresentation.Document;
export declare const toStandardJSONSchemaV1: <S extends Top>(self: S): StandardJSONSchemaV1<S["Encoded"], S["Type"]> & S;
export declare const toStandardSchemaV1: <S extends Top & { readonly DecodingServices: never; }>(self: S, options?: { readonly leafHook?: Issue.LeafHook | undefined; readonly checkHook?: Issue.CheckHook | undefined; readonly parseOptions?: AST.ParseOptions | undefined; }): StandardSchemaV1<S["Encoded"], S["Type"]> & S;
export declare const toTaggedUnion: <const Tag extends PropertyKey>(tag: Tag): <const Members extends ReadonlyArray<Top & { readonly Type: { readonly [K in Tag]: PropertyKey; }; }>>(self: Union<Members>) => toTaggedUnion<Tag, Members>;
export declare const toType: <S extends Top>(self: S): toType<S>;
export declare const withConstructorDefault: <S extends Top & WithoutConstructorDefault>(defaultValue: (input: Option_.Option<undefined>) => Option_.Option<S["~type.make.in"]> | Effect.Effect<Option_.Option<S["~type.make.in"]>>): (schema: S) => withConstructorDefault<S>;
```

## Other Exports (Non-Function)

- `Bottom` (interface)
- `ConstructorDefault` (type)
- `DecodingDefaultOptions` (type)
- `Encoder` (interface)
- `ToJsonSchemaOptions` (interface)
- `Top` (interface)
- `WithoutConstructorDefault` (interface)
