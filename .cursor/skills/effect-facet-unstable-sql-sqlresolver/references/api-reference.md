# API Reference: effect/unstable/sql/SqlResolver

- Import path: `effect/unstable/sql/SqlResolver`
- Source file: `packages/effect/src/unstable/sql/SqlResolver.ts`
- Function exports (callable): 6
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `findById`
- `grouped`
- `ordered`
- `request`
- `SqlRequest`
- `void`

## All Function Signatures

```ts
export declare const findById: <Id extends Schema.Top, Res extends Schema.Top, Row, E, R>(options: { readonly Id: Id; readonly Result: Res; readonly ResultId: (result: Res["Type"], row: Types.NoInfer<Row>) => Id["Type"]; readonly execute: (requests: Arr.NonEmptyArray<Id["Encoded"]>) => Effect.Effect<ReadonlyArray<Row>, E, R>; }): RequestResolver.RequestResolver<SqlRequest<Id["Type"], Res["Type"], E | Schema.SchemaError | Cause.NoSuchElementError, Id["EncodingServices"] | Res["DecodingServices"] | R>>;
export declare const grouped: <Req extends Schema.Top, Res extends Schema.Top, K, Row, E, R>(options: { readonly Request: Req; readonly RequestGroupKey: (request: Req["Type"]) => K; readonly Result: Res; readonly ResultGroupKey: (result: Res["Type"], row: Types.NoInfer<Row>) => K; readonly execute: (requests: Arr.NonEmptyArray<Req["Encoded"]>) => Effect.Effect<ReadonlyArray<Row>, E, R>; }): RequestResolver.RequestResolver<SqlRequest<Req["Type"], Arr.NonEmptyArray<Res["Type"]>, E | Schema.SchemaError | Cause.NoSuchElementError, Req["EncodingServices"] | Res["DecodingServices"] | R>>;
export declare const ordered: <Req extends Schema.Top, Res extends Schema.Top, _, E, R>(options: { readonly Request: Req; readonly Result: Res; readonly execute: (requests: Arr.NonEmptyArray<Req["Encoded"]>) => Effect.Effect<ReadonlyArray<_>, E, R>; }): RequestResolver.RequestResolver<SqlRequest<Req["Type"], Res["Type"], E | ResultLengthMismatch, Req["EncodingServices"] | Res["DecodingServices"] | R>>;
export declare const request: <In, A, E, R>(resolver: RequestResolver.RequestResolver<SqlRequest<In, A, E, R>>): (payload: In) => Effect.Effect<A, E | Schema.SchemaError, R>; // overload 1
export declare const request: <In, A, E, R>(payload: In, resolver: RequestResolver.RequestResolver<SqlRequest<In, A, E, R>>): Effect.Effect<A, E | Schema.SchemaError, R>; // overload 2
export declare const SqlRequest: <In, A, E, R>(payload: In): SqlRequest<In, A, E, R>;
export declare const void: <Req extends Schema.Top, _, E, R>(options: { readonly Request: Req; readonly execute: (requests: Arr.NonEmptyArray<Req["Encoded"]>) => Effect.Effect<ReadonlyArray<_>, E, R>; }): RequestResolver.RequestResolver<SqlRequest<Req["Type"], void, E | Schema.SchemaError, Req["EncodingServices"] | R>>;
```

## Other Exports (Non-Function)

- None
