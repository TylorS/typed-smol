# API Reference: effect/unstable/sql/SqlModel

- Import path: `effect/unstable/sql/SqlModel`
- Source file: `packages/effect/src/unstable/sql/SqlModel.ts`
- Function exports (callable): 2
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `makeDataLoaders`
- `makeRepository`

## All Function Signatures

```ts
export declare const makeDataLoaders: <S extends Model.Any, Id extends (keyof S["Type"]) & (keyof S["update"]["Type"]) & (keyof S["fields"])>(Model: S, options: { readonly tableName: string; readonly spanPrefix: string; readonly idColumn: Id; readonly window: Input; readonly maxBatchSize?: number | undefined; }): Effect.Effect<{ readonly insert: (insert: S["insert"]["Type"]) => Effect.Effect<S["Type"], SqlError | Schema.SchemaError, S["DecodingServices"] | S["insert"]["EncodingServices"]>; readonly insertVoid: (insert: S["insert"]["Type"]) => Effect.Effect<void, SqlError | Schema.SchemaError, S["insert"]["EncodingServices"]>; readonly findById: (id: S["fields"][Id]["Type"]) => Effect.Effect<S["Type"], SqlError | Schema.SchemaError | Cause.NoSuchElementError, S["DecodingServices"] | S["fields"][Id]["EncodingServices"]>; readonly delete: (id: S["fields"][Id]["Type"]) => Effect.Effect<void, SqlError | Schema.SchemaError, S["fields"][Id]["EncodingServices"]>; }, never, SqlClient | Scope>;
export declare const makeRepository: <S extends Model.Any, Id extends (keyof S["Type"]) & (keyof S["update"]["Type"]) & (keyof S["fields"])>(Model: S, options: { readonly tableName: string; readonly spanPrefix: string; readonly idColumn: Id; }): Effect.Effect<{ readonly insert: (insert: S["insert"]["Type"]) => Effect.Effect<S["Type"], Schema.SchemaError | SqlError, S["DecodingServices"] | S["insert"]["EncodingServices"]>; readonly insertVoid: (insert: S["insert"]["Type"]) => Effect.Effect<void, Schema.SchemaError | SqlError, S["insert"]["EncodingServices"]>; readonly update: (update: S["update"]["Type"]) => Effect.Effect<S["Type"], Schema.SchemaError | SqlError, S["DecodingServices"] | S["update"]["EncodingServices"]>; readonly updateVoid: (update: S["update"]["Type"]) => Effect.Effect<void, Schema.SchemaError | SqlError, S["update"]["EncodingServices"]>; readonly findById: (id: S["fields"][Id]["Type"]) => Effect.Effect<S["Type"], Cause.NoSuchElementError | Schema.SchemaError | SqlError, S["DecodingServices"] | S["fields"][Id]["EncodingServices"]>; readonly delete: (id: S["fields"][Id]["Type"]) => Effect.Effect<void, Schema.SchemaError | SqlError, S["fields"][Id]["EncodingServices"]>; }, never, SqlClient>;
```

## Other Exports (Non-Function)

- None
