# API Reference: effect/unstable/schema/Model

- Import path: `effect/unstable/schema/Model`
- Source file: `packages/effect/src/unstable/schema/Model.ts`
- Function exports (callable): 18
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Class`
- `extract`
- `Field`
- `fieldEvolve`
- `FieldExcept`
- `FieldOnly`
- `FieldOption`
- `fields`
- `Generated`
- `GeneratedByApp`
- `JsonFromString`
- `optionalOption`
- `Override`
- `Sensitive`
- `Struct`
- `Union`
- `UuidV4Insert`
- `UuidV4WithGenerate`

## All Function Signatures

```ts
export declare const Class: <Self = never>(identifier: string): <const Fields extends VariantSchema.Struct<in out A extends VariantSchema.Field<in out A extends VariantSchema.Field.Config>.Fields>.Fields>(fields: Fields & VariantSchema.Struct.Validate<Fields, "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">, annotations?: Schema.Annotations.Declaration<Self, readonly [Schema.Struct<VariantSchema.ExtractFields<"select", Fields, true>>]> | undefined) => [Self] extends [never] ? "Missing `Self` generic - use `class Self extends Class<Self>()({ ... })`" : VariantSchema.Class<Self, Fields, Schema.Struct<VariantSchema.ExtractFields<"select", Fields, true>>> & { readonly select: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"select", Fields, false>]: VariantSchema.ExtractFields<"select", Fields, false>[K]; }>; readonly insert: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"insert", Fields, false>]: VariantSchema.ExtractFields<"insert", Fields, false>[K]; }>; readonly update: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"update", Fields, false>]: VariantSchema.ExtractFields<"update", Fields, false>[K]; }>; readonly json: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"json", Fields, false>]: VariantSchema.ExtractFields<"json", Fields, false>[K]; }>; readonly jsonCreate: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"jsonCreate", Fields, false>]: VariantSchema.ExtractFields<"jsonCreate", Fields, false>[K]; }>; readonly jsonUpdate: Schema.Struct<{ [K in keyof VariantSchema.ExtractFields<"jsonUpdate", Fields, false>]: VariantSchema.ExtractFields<"jsonUpdate", Fields, false>[K]; }>; };
export declare const extract: <V extends "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">(variant: V): <A extends VariantSchema.Struct<any>>(self: A) => VariantSchema.Extract<V, A, V extends "select" ? true : false>; // overload 1
export declare const extract: <V extends "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate", A extends VariantSchema.Struct<any>>(self: A, variant: V): VariantSchema.Extract<V, A, V extends "select" ? true : false>; // overload 2
export declare const Field: <const A extends VariantSchema.Field<in out A extends VariantSchema.Field.Config>.ConfigWithKeys<"select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">>(config: A & { readonly [K in Exclude<keyof A, "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">]: never; }): VariantSchema.Field<A>;
export declare const fieldEvolve: <Self extends VariantSchema.Field<any> | Schema.Top, const Mapping extends Self extends VariantSchema.Field<infer S extends VariantSchema.Field<in out A extends VariantSchema.Field.Config>.Config> ? { readonly [K in keyof S]?: (variant: S[K]) => Schema.Top; } : { readonly select?: (variant: Self) => Schema.Top; readonly insert?: (variant: Self) => Schema.Top; readonly update?: (variant: Self) => Schema.Top; readonly json?: (variant: Self) => Schema.Top; readonly jsonCreate?: (variant: Self) => Schema.Top; readonly jsonUpdate?: (variant: Self) => Schema.Top; }>(f: Mapping): (self: Self) => VariantSchema.Field<Self extends VariantSchema.Field<infer S extends VariantSchema.Field.Config> ? { readonly [K in keyof S]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : S[K] : S[K]; } : { readonly select: "select" extends keyof Mapping ? Mapping[keyof Mapping & "select"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "select"]> : Self : Self; readonly insert: "insert" extends keyof Mapping ? Mapping[keyof Mapping & "insert"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "insert"]> : Self : Self; readonly update: "update" extends keyof Mapping ? Mapping[keyof Mapping & "update"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "update"]> : Self : Self; readonly json: "json" extends keyof Mapping ? Mapping[keyof Mapping & "json"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "json"]> : Self : Self; readonly jsonCreate: "jsonCreate" extends keyof Mapping ? Mapping[keyof Mapping & "jsonCreate"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "jsonCreate"]> : Self : Self; readonly jsonUpdate: "jsonUpdate" extends keyof Mapping ? Mapping[keyof Mapping & "jsonUpdate"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "jsonUpdate"]> : Self : Self; }>; // overload 1
export declare const fieldEvolve: <Self extends VariantSchema.Field<any> | Schema.Top, const Mapping extends Self extends VariantSchema.Field<infer S extends VariantSchema.Field<in out A extends VariantSchema.Field.Config>.Config> ? { readonly [K in keyof S]?: (variant: S[K]) => Schema.Top; } : { readonly select?: (variant: Self) => Schema.Top; readonly insert?: (variant: Self) => Schema.Top; readonly update?: (variant: Self) => Schema.Top; readonly json?: (variant: Self) => Schema.Top; readonly jsonCreate?: (variant: Self) => Schema.Top; readonly jsonUpdate?: (variant: Self) => Schema.Top; }>(self: Self, f: Mapping): VariantSchema.Field<Self extends VariantSchema.Field<infer S extends VariantSchema.Field.Config> ? { readonly [K in keyof S]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : S[K] : S[K]; } : { readonly select: "select" extends keyof Mapping ? Mapping[keyof Mapping & "select"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "select"]> : Self : Self; readonly insert: "insert" extends keyof Mapping ? Mapping[keyof Mapping & "insert"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "insert"]> : Self : Self; readonly update: "update" extends keyof Mapping ? Mapping[keyof Mapping & "update"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "update"]> : Self : Self; readonly json: "json" extends keyof Mapping ? Mapping[keyof Mapping & "json"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "json"]> : Self : Self; readonly jsonCreate: "jsonCreate" extends keyof Mapping ? Mapping[keyof Mapping & "jsonCreate"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "jsonCreate"]> : Self : Self; readonly jsonUpdate: "jsonUpdate" extends keyof Mapping ? Mapping[keyof Mapping & "jsonUpdate"] extends (arg: any) => any ? ReturnType<Mapping[keyof Mapping & "jsonUpdate"]> : Self : Self; }>; // overload 2
export declare const FieldExcept: <const Keys extends readonly ("select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate")[]>(...keys: Keys): <S extends Schema.Top>(schema: S) => VariantSchema.Field<{ readonly [K in Exclude<"select", Keys[number]> | Exclude<"insert", Keys[number]> | Exclude<"update", Keys[number]> | Exclude<"json", Keys[number]> | Exclude<"jsonCreate", Keys[number]> | Exclude<"jsonUpdate", Keys[number]>]: S; }>;
export declare const FieldOnly: <const Keys extends readonly ("select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate")[]>(...keys: Keys): <S extends Schema.Top>(schema: S) => VariantSchema.Field<{ readonly [K in Keys[number]]: S; }>;
export declare const FieldOption: <Field extends VariantSchema.Field<any> | Schema.Top>(self: Field): Field extends Schema.Top ? FieldOption<Field> : Field extends VariantSchema.Field<infer S> ? VariantSchema.Field<{ readonly [K in keyof S]: S[K] extends Schema.Top ? K extends VariantsDatabase ? Schema.OptionFromNullOr<S[K]> : optionalOption<S[K]> : never; }> : never;
export declare const fields: <A extends VariantSchema.Struct<any>>(self: A): A[typeof VariantSchema.TypeId];
export declare const Generated: <S extends Schema.Top>(schema: S): Generated<S>;
export declare const GeneratedByApp: <S extends Schema.Top>(schema: S): GeneratedByApp<S>;
export declare const JsonFromString: <S extends Schema.Top>(schema: S): JsonFromString<S>;
export declare const optionalOption: <S extends Schema.Top>(schema: S): optionalOption<S>;
export declare const Override: <A>(value: A): A & Brand<"Override">;
export declare const Sensitive: <S extends Schema.Top>(schema: S): Sensitive<S>;
export declare const Struct: <const A extends VariantSchema.Struct<in out A extends VariantSchema.Field<in out A extends VariantSchema.Field.Config>.Fields>.Fields>(fields: A & VariantSchema.Struct.Validate<A, "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">): VariantSchema.Struct<A>;
export declare const Union: <const Members extends ReadonlyArray<VariantSchema.Struct<any>>>(...members: Members): VariantSchema.Union<Members> & VariantSchema.Union<Members extends ReadonlyArray<VariantSchema.Struct<any>>>.Variants<Members, "select" | "insert" | "update" | "json" | "jsonCreate" | "jsonUpdate">;
export declare const UuidV4Insert: <const B extends string>(schema: Schema.brand<Schema.instanceOf<Uint8Array<ArrayBuffer>>, B>): UuidV4Insert<B>;
export declare const UuidV4WithGenerate: <B extends string>(schema: Schema.brand<Schema.instanceOf<Uint8Array<ArrayBuffer>>, B>): VariantSchema.Overrideable<Schema.brand<Schema.instanceOf<Uint8Array<ArrayBuffer>>, B>>;
```

## Other Exports (Non-Function)

- `Any` (type)
- `Date` (interface)
- `DateTimeFromDateWithNow` (variable)
- `DateTimeFromNumberWithNow` (variable)
- `DateTimeInsert` (interface)
- `DateTimeInsertFromDate` (interface)
- `DateTimeInsertFromNumber` (interface)
- `DateTimeUpdate` (interface)
- `DateTimeUpdateFromDate` (interface)
- `DateTimeUpdateFromNumber` (interface)
- `DateTimeWithNow` (variable)
- `DateWithNow` (variable)
- `Uint8Array` (variable)
- `VariantsDatabase` (type)
- `VariantsJson` (type)
