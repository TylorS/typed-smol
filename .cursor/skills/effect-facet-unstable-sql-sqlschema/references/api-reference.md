# API Reference: effect/unstable/sql/SqlSchema

- Import path: `effect/unstable/sql/SqlSchema`
- Source file: `packages/effect/src/unstable/sql/SqlSchema.ts`
- Function exports (callable): 5
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `findAll`
- `findNonEmpty`
- `findOne`
- `findOneOption`
- `void`

## All Function Signatures

```ts
export declare const findAll: <Req extends Schema.Top, Res extends Schema.Top, E, R>(options: { readonly Request: Req; readonly Result: Res; readonly execute: (request: Req["Encoded"]) => Effect.Effect<ReadonlyArray<unknown>, E, R>; }): (request: Req["Encoded"]) => Effect.Effect<Array<Res["Type"]>, E | Schema.SchemaError, Req["EncodingServices"] | Res["DecodingServices"] | R>;
export declare const findNonEmpty: <Req extends Schema.Top, Res extends Schema.Top, E, R>(options: { readonly Request: Req; readonly Result: Res; readonly execute: (request: Req["Encoded"]) => Effect.Effect<ReadonlyArray<unknown>, E, R>; }): (request: Req["Encoded"]) => Effect.Effect<Arr.NonEmptyArray<Res["Type"]>, E | Schema.SchemaError | Cause.NoSuchElementError, Req["EncodingServices"] | Res["DecodingServices"] | R>;
export declare const findOne: <Req extends Schema.Top, Res extends Schema.Top, E, R>(options: { readonly Request: Req; readonly Result: Res; readonly execute: (request: Req["Encoded"]) => Effect.Effect<ReadonlyArray<unknown>, E, R>; }): (request: Req["Type"]) => Effect.Effect<Res["Type"], E | Schema.SchemaError | Cause.NoSuchElementError, R | Req["EncodingServices"] | Res["DecodingServices"]>;
export declare const findOneOption: <Req extends Schema.Top, Res extends Schema.Top, E, R>(options: { readonly Request: Req; readonly Result: Res; readonly execute: (request: Req["Encoded"]) => Effect.Effect<ReadonlyArray<unknown>, E, R>; }): (request: Req["Type"]) => Effect.Effect<Option.Option<Res["Type"]>, E | Schema.SchemaError, R | Req["EncodingServices"] | Res["DecodingServices"]>;
export declare const void: <Req extends Schema.Top, E, R>(options: { readonly Request: Req; readonly execute: (request: Req["Encoded"]) => Effect.Effect<unknown, E, R>; }): (request: Req["Type"]) => Effect.Effect<void, E | Schema.SchemaError, R | Req["EncodingServices"]>;
```

## Other Exports (Non-Function)

- None
