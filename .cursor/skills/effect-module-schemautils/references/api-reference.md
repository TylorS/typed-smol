# API Reference: effect/SchemaUtils

- Import path: `effect/SchemaUtils`
- Source file: `packages/effect/src/SchemaUtils.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `getNativeClassSchema`

## All Function Signatures

```ts
export declare const getNativeClassSchema: <C extends new (...args: any) => any, S extends Schema.Struct<Schema.Struct.Fields>>(constructor: C, options: { readonly encoding: S; readonly annotations?: Schema.Annotations.Declaration<InstanceType<C>>; }): Schema.decodeTo<Schema.instanceOf<InstanceType<C>, S["Iso"]>, S>;
```

## Other Exports (Non-Function)

- None
