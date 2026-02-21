# API Reference: effect/unstable/schema/VariantSchema

- Import path: `effect/unstable/schema/VariantSchema`
- Source file: `packages/effect/src/unstable/schema/VariantSchema.ts`
- Function exports (callable): 6
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fields`
- `isField`
- `isStruct`
- `make`
- `Override`
- `Overrideable`

## All Function Signatures

```ts
export declare const fields: <A extends Struct<any>>(self: A): A[typeof TypeId];
export declare const isField: (u: unknown): u is Field<any>;
export declare const isStruct: (u: unknown): u is Struct<any>;
export declare const make: <const Variants extends ReadonlyArray<string>, const Default extends Variants[number]>(options: { readonly variants: Variants; readonly defaultVariant: Default; }): { readonly Struct: <const A extends Struct.Fields>(fields: A & Struct.Validate<A, Variants[number]>) => Struct<A>; readonly Field: <const A extends Field.ConfigWithKeys<Variants[number]>>(config: A & { readonly [K in Exclude<keyof A, Variants[number]>]: never; }) => Field<A>; readonly FieldOnly: <const Keys extends ReadonlyArray<Variants[number]>>(...keys: Keys) => <S extends Schema.Top>(schema: S) => Field<{ readonly [K in Keys[number]]: S; }>; readonly FieldExcept: <const Keys extends ReadonlyArray<Variants[number]>>(...keys: Keys) => <S extends Schema.Top>(schema: S) => Field<{ readonly [K in Exclude<Variants[number], Keys[number]>]: S; }>; readonly fieldEvolve: { <Self extends Field<any> | Schema.Top, const Mapping extends (Self extends Field<infer S> ? { readonly [K in keyof S]?: (variant: S[K]) => Schema.Top; } : { readonly [K in Variants[number]]?: (variant: Self) => Schema.Top; })>(f: Mapping): (self: Self) => Field<Self extends Field<infer S> ? { readonly [K in keyof S]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : S[K] : S[K]; } : { readonly [K in Variants[number]]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : Self : Self; }>; <Self extends Field<any> | Schema.Top, const Mapping extends (Self extends Field<infer S> ? { readonly [K in keyof S]?: (variant: S[K]) => Schema.Top; } : { readonly [K in Variants[number]]?: (variant: Self) => Schema.Top; })>(self: Self, f: Mapping): Field<Self extends Field<infer S> ? { readonly [K in keyof S]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : S[K] : S[K]; } : { readonly [K in Variants[number]]: K extends keyof Mapping ? Mapping[K] extends (arg: any) => any ? ReturnType<Mapping[K]> : Self : Self; }>; }; readonly Class: <Self = never>(identifier: string) => <const Fields extends Struct.Fields>(fields: Fields & Struct.Validate<Fields, Variants[number]>, annotations?: Schema.Annotations.Declaration<Self, readonly [Schema.Struct<ExtractFields<Default, Fields, true>>]> | undefined) => [Self] extends [never] ? MissingSelfGeneric : Class<Self, Fields, Schema.Struct<ExtractFields<Default, Fields, true>>> & { readonly [V in Variants[number]]: Extract<V, Struct<Fields>>; }; readonly Union: <const Members extends ReadonlyArray<Struct<any>>>(...members: Members) => Union<Members> & Union.Variants<Members, Variants[number]>; readonly extract: { <V extends Variants[number]>(variant: V): <A extends Struct<any>>(self: A) => Extract<V, A, V extends Default ? true : false>; <V extends Variants[number], A extends Struct<any>>(self: A, variant: V): Extract<V, A, V extends Default ? true : false>; }; };
export declare const Override: <A>(value: A): A & Brand<"Override">;
export declare const Overrideable: <S extends Schema.Top & Schema.WithoutConstructorDefault>(schema: S, options: { readonly defaultValue: Effect.Effect<S["~type.make.in"]>; }): Overrideable<S>;
```

## Other Exports (Non-Function)

- `Class` (interface)
- `Extract` (type)
- `ExtractFields` (type)
- `Field` (interface)
- `Struct` (interface)
- `TypeId` (variable)
- `Union` (interface)
