# API Reference: effect/Schema

- Import path: `effect/Schema`
- Source file: `packages/effect/src/Schema.ts`
- Function exports (callable): 195
- Non-function exports: 93

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `_getTagValueIfPropertyKey`
- `annotate`
- `annotateKey`
- `Array`
- `asserts`
- `brand`
- `catchDecoding`
- `catchDecodingWithContext`
- `catchEncoding`
- `catchEncodingWithContext`
- `Cause`
- `CauseReason`
- `check`
- `Class`
- `declare`
- `declareConstructor`
- `decode`
- `decodeEffect`

## All Function Signatures

```ts
export declare const _getTagValueIfPropertyKey: (tag: PropertyKey, ast: AST.Objects): PropertyKey | undefined;
export declare const annotate: <S extends Top>(annotations: S["~annotate.in"]): (self: S) => S["~rebuild.out"];
export declare const annotateKey: <S extends Top>(annotations: Annotations.Key<S["Type"]>): (self: S) => S["~rebuild.out"];
export declare const Array: <S extends Top>(self: S): $Array<S>;
export declare const asserts: <S extends Top & { readonly DecodingServices: never; }>(schema: S): <I>(input: I) => asserts input is I & S["Type"];
export declare const brand: <B extends string>(identifier: B): <S extends Top>(schema: S) => brand<S["~rebuild.out"], B>;
export declare const catchDecoding: <S extends Top>(f: (issue: Issue.Issue) => Effect.Effect<Option_.Option<S["Type"]>, Issue.Issue>): (self: S) => S["~rebuild.out"];
export declare const catchDecodingWithContext: <S extends Top, R = never>(f: (issue: Issue.Issue) => Effect.Effect<Option_.Option<S["Type"]>, Issue.Issue, R>): (self: S) => middlewareDecoding<S, S["DecodingServices"] | R>;
export declare const catchEncoding: <S extends Top>(f: (issue: Issue.Issue) => Effect.Effect<Option_.Option<S["Encoded"]>, Issue.Issue>): (self: S) => S["~rebuild.out"];
export declare const catchEncodingWithContext: <S extends Top, R = never>(f: (issue: Issue.Issue) => Effect.Effect<Option_.Option<S["Encoded"]>, Issue.Issue, R>): (self: S) => middlewareEncoding<S, S["EncodingServices"] | R>;
export declare const Cause: <E extends Top, D extends Top>(error: E, defect: D): Cause<E, D>;
export declare const CauseReason: <E extends Top, D extends Top>(error: E, defect: D): CauseReason<E, D>;
export declare const check: <S extends Top>(checks_0: AST.Check<S["Type"]>, ...checks: AST.Check<S["Type"]>[]): (self: S) => S["~rebuild.out"];
export declare const Class: <Self, Brand = {}>(identifier: string): { <const Fields extends Struct.Fields>(fields: Fields, annotations?: Annotations.Declaration<Self, readonly [Struct<Fields>]>): ExtendableClass<Self, Struct<Fields>, Brand>; <S extends Struct<Struct.Fields>>(schema: S, annotations?: Annotations.Declaration<Self, readonly [S]>): ExtendableClass<Self, S, Brand>; };
export declare const declare: <T, Iso = T>(is: (u: unknown) => u is T, annotations?: Annotations.Declaration<T> | undefined): declare<T, Iso>;
export declare const declareConstructor: <T, E = T, Iso = T>(): <const TypeParameters extends ReadonlyArray<Top>>(typeParameters: TypeParameters, run: (typeParameters: { readonly [K in keyof TypeParameters]: Codec<TypeParameters[K]["Type"], TypeParameters[K]["Encoded"]>; }) => (u: unknown, self: AST.Declaration, options: AST.ParseOptions) => Effect.Effect<T, Issue.Issue>, annotations?: Annotations.Declaration<T, TypeParameters>) => declareConstructor<T, E, TypeParameters, Iso>;
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
export declare const Enum: <A extends { [x: string]: string | number; }>(enums: A): Enum<A>;
export declare const ErrorClass: <Self, Brand = {}>(identifier: string): { <const Fields extends Struct.Fields>(fields: Fields, annotations?: Annotations.Declaration<Self, readonly [Struct<Fields>]>): ErrorClass<Self, Struct<Fields>, Cause_.YieldableError & Brand>; <S extends Struct<Struct.Fields>>(schema: S, annotations?: Annotations.Declaration<Self, readonly [S]>): ErrorClass<Self, S, Cause_.YieldableError & Brand>; };
export declare const Exit: <A extends Top, E extends Top, D extends Top>(value: A, error: E, defect: D): Exit<A, E, D>;
export declare const extendTo: <S extends Struct<Struct.Fields>, const Fields extends Struct.Fields>(fields: Fields, derive: { readonly [K in keyof Fields]: (s: S["Type"]) => Option_.Option<Fields[K]["Type"]>; }): (self: S) => decodeTo<Struct<Simplify<{ [K in keyof S["fields"]]: toType<S["fields"][K]>; } & Fields>>, S>;
export declare const fieldsAssign: <const NewFields extends Struct.Fields>(fields: NewFields): fieldsAssign<NewFields>;
export declare const flip: <S extends Top>(schema: S): S extends flip<infer F> ? F["~rebuild.out"] : flip<S>;
export declare const fromBrand: <A extends Brand.Brand<any>>(identifier: string, ctor: Brand.Constructor<A>): <S extends Top & { readonly "Type": Brand.Brand.Unbranded<A>; }>(self: S) => brand<S["~rebuild.out"], Brand.Brand.Keys<A>>;
export declare const fromFormData: <S extends Top>(schema: S): fromFormData<S>;
export declare const fromJsonString: <S extends Top>(schema: S): fromJsonString<S>;
export declare const fromURLSearchParams: <S extends Top>(schema: S): fromURLSearchParams<S>;
export declare const HashMap: <Key extends Top, Value extends Top>(key: Key, value: Value): HashMap<Key, Value>;
export declare const HashSet: <Value extends Top>(value: Value): HashSet<Value>;
export declare const instanceOf: <C extends abstract new (...args: any) => any, Iso = InstanceType<C>>(constructor: C, annotations?: Annotations.Declaration<InstanceType<C>> | undefined): instanceOf<InstanceType<C>, Iso>;
export declare const is: <S extends Top & { readonly DecodingServices: never; }>(schema: S): <I>(input: I) => input is I & S["Type"];
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
export declare const link: <T>(): <To extends Top>(encodeTo: To, transformation: { readonly decode: Getter.Getter<T, NoInfer<To["Type"]>>; readonly encode: Getter.Getter<NoInfer<To["Type"]>, T>; }) => AST.Link;
export declare const Literal: <L extends AST.LiteralValue>(literal: L): Literal<L>;
export declare const Literals: <const L extends ReadonlyArray<AST.LiteralValue>>(literals: L): Literals<L>;
export declare const make: <S extends Top>(ast: S["ast"], options?: object): S;
export declare const makeFilter: <T>(filter: (input: T, ast: AST.AST, options: AST.ParseOptions) => undefined | boolean | string | Issue.Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }, annotations?: Annotations.Filter | undefined, abort?: boolean): AST.Filter<T>;
export declare const makeFilterGroup: <T>(checks: readonly [AST.Check<T>, ...Array<AST.Check<T>>], annotations?: Annotations.Filter | undefined): AST.FilterGroup<T>;
export declare const makeIsBetween: <T>(deriveOptions: { readonly order: Order.Order<T>; readonly annotate?: ((options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (options: { readonly minimum: T; readonly maximum: T; readonly exclusiveMinimum?: boolean | undefined; readonly exclusiveMaximum?: boolean | undefined; }, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMinimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsGreaterThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMinimum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (minimum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThan: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (exclusiveMaximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsLessThanOrEqualTo: <T>(options: { readonly order: Order.Order<T>; readonly annotate?: ((exclusiveMaximum: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (maximum: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const makeIsMultipleOf: <T>(options: { readonly remainder: (input: T, divisor: T) => T; readonly zero: NoInfer<T>; readonly annotate?: ((divisor: T) => Annotations.Filter) | undefined; readonly formatter?: Formatter<T> | undefined; }): (divisor: T, annotations?: Annotations.Filter) => AST.Filter<T>;
export declare const middlewareDecoding: <S extends Top, RD>(decode: (effect: Effect.Effect<Option_.Option<S["Type"]>, Issue.Issue, S["DecodingServices"]>, options: AST.ParseOptions) => Effect.Effect<Option_.Option<S["Type"]>, Issue.Issue, RD>): (schema: S) => middlewareDecoding<S, RD>;
export declare const middlewareEncoding: <S extends Top, RE>(encode: (effect: Effect.Effect<Option_.Option<S["Encoded"]>, Issue.Issue, S["EncodingServices"]>, options: AST.ParseOptions) => Effect.Effect<Option_.Option<S["Encoded"]>, Issue.Issue, RE>): (schema: S) => middlewareEncoding<S, RE>;
export declare const mutable: <S extends Top & { readonly "ast": AST.Arrays; }>(self: S): mutable<S>;
export declare const mutableKey: <S extends Top>(self: S): mutableKey<S>;
export declare const MutableTree: <S extends Top>(node: S): Union<readonly [S, mutable<$Array<suspend<Codec<MutableTree<S["Type"]>, MutableTree<S["Encoded"]>, S["DecodingServices"], S["EncodingServices"]>>>>, $Record<String, mutableKey<suspend<Codec<MutableTree<S["Type"]>, MutableTree<S["Encoded"]>, S["DecodingServices"], S["EncodingServices"]>>>>]>;
export declare const NonEmptyArray: <S extends Top>(self: S): NonEmptyArray<S>;
export declare const NullishOr: <S extends Top>(self: S): NullishOr<S>;
export declare const NullOr: <S extends Top>(self: S): NullOr<S>;
export declare const Opaque: <Self, Brand = {}>(): <S extends Top>(schema: S) => Opaque<Self, S, Brand> & Omit<S, "Type">;
export declare const Option: <A extends Top>(value: A): Option<A>;
export declare const optional: <S extends Top>(self: S): optional<S>;
export declare const optionalKey: <S extends Top>(self: S): optionalKey<S>;
export declare const OptionFromNullOr: <S extends Top>(schema: S): OptionFromNullOr<S>;
export declare const OptionFromOptional: <S extends Top>(schema: S): OptionFromOptional<S>;
export declare const OptionFromOptionalKey: <S extends Top>(schema: S): OptionFromOptionalKey<S>;
export declare const overrideToCodecIso: <S extends Top, Iso>(to: Codec<Iso>, transformation: { readonly decode: Getter.Getter<S["Type"], Iso>; readonly encode: Getter.Getter<Iso, S["Type"]>; }): (schema: S) => overrideToCodecIso<S, Iso>;
export declare const overrideToEquivalence: <S extends Top>(toEquivalence: () => Equivalence.Equivalence<S["Type"]>): (self: S) => S["~rebuild.out"];
export declare const overrideToFormatter: <S extends Top>(toFormatter: () => Formatter<S["Type"]>): (self: S) => S["~rebuild.out"];
export declare const readonlyKey: <S extends Top>(self: mutableKey<S>): S;
export declare const ReadonlyMap: <Key extends Top, Value extends Top>(key: Key, value: Value): $ReadonlyMap<Key, Value>;
export declare const ReadonlySet: <Value extends Top>(value: Value): $ReadonlySet<Value>;
export declare const Record: <Key extends Record.Key, Value extends Top>(key: Key, value: Value, options?: { readonly keyValueCombiner: { readonly decode?: Combiner.Combiner<readonly [Key["Type"], Value["Type"]]> | undefined; readonly encode?: Combiner.Combiner<readonly [Key["Encoded"], Value["Encoded"]]> | undefined; }; }): $Record<Key, Value>;
export declare const redact: <S extends Top>(schema: S): middlewareDecoding<S, S["DecodingServices"]>;
export declare const Redacted: <S extends Top>(value: S, options?: { readonly label?: string | undefined; }): Redacted<S>;
export declare const RedactedFromValue: <S extends Top>(value: S, options?: { readonly label?: string | undefined; }): RedactedFromValue<S>;
export declare const refine: <S extends Top, T extends S["Type"]>(refinement: (value: S["Type"]) => value is T, annotations?: Annotations.Filter): (schema: S) => refine<T, S>;
export declare const required: <S extends Top>(self: optional<S>): S;
export declare const requiredKey: <S extends Top>(self: optionalKey<S>): S;
export declare const resolveInto: <S extends Top>(schema: S): S["~annotate.in"] | undefined;
export declare const Result: <A extends Top, E extends Top>(success: A, failure: E): Result<A, E>;
export declare const revealBottom: <S extends Top>(bottom: S): Bottom<S["Type"], S["Encoded"], S["DecodingServices"], S["EncodingServices"], S["ast"], S["~rebuild.out"], S["~type.make.in"], S["Iso"], S["~type.parameters"], S["~type.make"], S["~type.mutability"], S["~type.optionality"], S["~type.constructor.default"], S["~encoded.mutability"], S["~encoded.optionality"]>;
export declare const revealCodec: <T, E, RD, RE>(codec: Codec<T, E, RD, RE>): Codec<T, E, RD, RE>;
export declare const Struct: <const Fields extends Struct.Fields>(fields: Fields): Struct<Fields>;
export declare const StructWithRest: <const S extends StructWithRest.Objects, const Records extends StructWithRest.Records>(schema: S, records: Records): StructWithRest<S, Records>;
export declare const suspend: <S extends Top>(f: () => S): suspend<S>;
export declare const tag: <Tag extends AST.LiteralValue>(literal: Tag): tag<Tag>;
export declare const tagDefaultOmit: <Tag extends AST.LiteralValue>(literal: Tag): withDecodingDefaultKey<tag<Tag>>;
export declare const TaggedClass: <Self, Brand = {}>(identifier?: string): { <Tag extends string, const Fields extends Struct.Fields>(tag: Tag, fields: Fields, annotations?: Annotations.Declaration<Self, readonly [TaggedStruct<Tag, Fields>]>): ExtendableClass<Self, TaggedStruct<Tag, Fields>, Brand>; <Tag extends string, S extends Struct<Struct.Fields>>(tag: Tag, schema: S, annotations?: Annotations.Declaration<Self, readonly [Struct<Simplify<{ readonly _tag: tag<Tag>; } & S["fields"]>>]>): ExtendableClass<Self, Struct<Simplify<{ readonly _tag: tag<Tag>; } & S["fields"]>>, Brand>; };
export declare const TaggedErrorClass: <Self, Brand = {}>(identifier?: string): { <Tag extends string, const Fields extends Struct.Fields>(tag: Tag, fields: Fields, annotations?: Annotations.Declaration<Self, readonly [TaggedStruct<Tag, Fields>]>): ErrorClass<Self, TaggedStruct<Tag, Fields>, Cause_.YieldableError & Brand>; <Tag extends string, S extends Struct<Struct.Fields>>(tag: Tag, schema: S, annotations?: Annotations.Declaration<Self, readonly [Struct<Simplify<{ readonly _tag: tag<Tag>; } & S["fields"]>>]>): ErrorClass<Self, Struct<Simplify<{ readonly _tag: tag<Tag>; } & S["fields"]>>, Cause_.YieldableError & Brand>; };
export declare const TaggedStruct: <const Tag extends AST.LiteralValue, const Fields extends Struct.Fields>(value: Tag, fields: Fields): TaggedStruct<Tag, Fields>;
export declare const TaggedUnion: <const CasesByTag extends Record<string, Struct.Fields>>(casesByTag: CasesByTag): TaggedUnion<{ readonly [K in keyof CasesByTag & string]: TaggedStruct<K, CasesByTag[K]>; }>;
export declare const TemplateLiteral: <const Parts extends TemplateLiteral.Parts>(parts: Parts): TemplateLiteral<Parts>;
export declare const TemplateLiteralParser: <const Parts extends TemplateLiteral.Parts>(parts: Parts): TemplateLiteralParser<Parts>;
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
export declare const Tree: <S extends Top>(node: S): Union<readonly [S, $Array<suspend<Codec<Tree<S["Type"]>, Tree<S["Encoded"]>, S["DecodingServices"], S["EncodingServices"]>>>, $Record<String, suspend<Codec<Tree<S["Type"]>, Tree<S["Encoded"]>, S["DecodingServices"], S["EncodingServices"]>>>]>;
export declare const Tuple: <const Elements extends ReadonlyArray<Top>>(elements: Elements): Tuple<Elements>;
export declare const TupleWithRest: <S extends Tuple<Tuple.Elements>, const Rest extends TupleWithRest.Rest>(schema: S, rest: Rest): TupleWithRest<S, Rest>;
export declare const UndefinedOr: <S extends Top>(self: S): UndefinedOr<S>;
export declare const Union: <const Members extends ReadonlyArray<Top>>(members: Members, options?: { mode?: "anyOf" | "oneOf"; }): Union<Members>;
export declare const UniqueArray: <S extends Top>(item: S): UniqueArray<S>;
export declare const UniqueSymbol: <const sym extends symbol>(symbol: sym): UniqueSymbol<sym>;
export declare const withConstructorDefault: <S extends Top & WithoutConstructorDefault>(defaultValue: (input: Option_.Option<undefined>) => Option_.Option<S["~type.make.in"]> | Effect.Effect<Option_.Option<S["~type.make.in"]>>): (schema: S) => withConstructorDefault<S>;
export declare const withDecodingDefault: <S extends Top>(defaultValue: () => S["Encoded"], options?: DecodingDefaultOptions): (self: S) => withDecodingDefault<S>;
export declare const withDecodingDefaultKey: <S extends Top>(defaultValue: () => S["Encoded"], options?: DecodingDefaultOptions): (self: S) => withDecodingDefaultKey<S>;
```

## Other Exports (Non-Function)

- `$Array` (interface)
- `$ReadonlyMap` (interface)
- `$ReadonlySet` (interface)
- `$Record` (interface)
- `Annotations` (namespace)
- `Any` (interface)
- `BigDecimal` (interface)
- `BigInt` (interface)
- `Boolean` (interface)
- `BooleanFromBit` (interface)
- `Bottom` (interface)
- `CauseIso` (type)
- `CauseReasonIso` (type)
- `Char` (variable)
- `Codec` (interface)
- `compose` (interface)
- `ConstructorDefault` (type)
- `Date` (interface)
- `DateTimeUtc` (interface)
- `DateTimeUtcFromDate` (interface)
- `DateTimeUtcFromMillis` (interface)
- `DateTimeUtcFromString` (interface)
- `DateTimeZoned` (interface)
- `DateValid` (interface)
- `Decoder` (interface)
- `DecodingDefaultOptions` (type)
- `Defect` (interface)
- `DefectWithStack` (variable)
- `Duration` (interface)
- `DurationFromMillis` (interface)
- `DurationFromNanos` (interface)
- `Encoder` (interface)
- `Error` (interface)
- `ErrorWithStack` (variable)
- `ExitIso` (type)
- `ExtendableClass` (interface)
- `File` (interface)
- `Finite` (interface)
- `FiniteFromString` (interface)
- `FormData` (interface)
- `HashMapIso` (type)
- `HashSetIso` (type)
- `Int` (interface)
- `Json` (type)
- `JsonArray` (interface)
- `JsonObject` (interface)
- `LazyArbitrary` (type)
- `MakeOptions` (interface)
- `Mutability` (type)
- `MutableJson` (type)
- `MutableJsonArray` (interface)
- `MutableJsonObject` (interface)
- `MutableTreeRecord` (interface)
- `Never` (interface)
- `NonEmptyString` (variable)
- `Null` (interface)
- `Number` (interface)
- `NumberFromString` (interface)
- `ObjectKeyword` (interface)
- `Optic` (interface)
- `Optionality` (type)
- `OptionIso` (type)
- `PropertyKey` (variable)
- `ReadonlyMapIso` (type)
- `ReadonlySetIso` (type)
- `RegExp` (interface)
- `ResultIso` (type)
- `Schema` (interface)
- `SchemaError` (class)
- `StandardSchemaV1FailureResult` (variable)
- `String` (interface)
- `StringTree` (type)
- `Symbol` (interface)
- `TimeZone` (interface)
- `TimeZoneNamed` (interface)
- `TimeZoneOffset` (interface)
- `ToJsonSchemaOptions` (interface)
- `Top` (interface)
- `TreeObject` (interface)
- `Trim` (interface)
- `Trimmed` (interface)
- `Uint8Array` (interface)
- `Uint8ArrayFromBase64` (interface)
- `Uint8ArrayFromBase64Url` (interface)
- `Uint8ArrayFromHex` (interface)
- `Undefined` (interface)
- `Unknown` (interface)
- `UnknownFromJsonString` (interface)
- `URL` (interface)
- `URLFromString` (interface)
- `URLSearchParams` (interface)
- `Void` (interface)
- `WithoutConstructorDefault` (interface)
