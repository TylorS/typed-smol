# API Reference: effect/unstable/persistence/Persistable

- Import path: `effect/unstable/persistence/Persistable`
- Source file: `packages/effect/src/unstable/persistence/Persistable.ts`
- Function exports (callable): 4
- Non-function exports: 11

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Class`
- `deserializeExit`
- `exitSchema`
- `serializeExit`

## All Function Signatures

```ts
export declare const Class: <Config extends { payload: Record<string, unknown>; requires?: any; requestError?: any; } = { payload: {}; }>(): <const Tag extends string, A extends Schema.Top = Schema.Void, E extends Schema.Top = Schema.Never>(tag: Tag, options: { readonly primaryKey: (payload: Config["payload"]) => string; readonly success?: A | undefined; readonly error?: E | undefined; }) => new (args: Types.EqualsWith<Config["payload"], {}, void, { readonly [P in keyof Config["payload"] as P extends "_tag" ? never : P]: Config["payload"][P]; }>) => { readonly _tag: Tag; } & { readonly [K in keyof Config["payload"]]: Config["payload"][K]; } & Persistable<A, E> & Request.Request<A["Type"], E["Type"] | ("requestError" extends keyof Config ? Config["requestError"] : (PersistenceError | Schema.SchemaError)), A["DecodingServices"] | A["EncodingServices"] | E["DecodingServices"] | E["EncodingServices"] | ("requires" extends keyof Config ? Config["requires"] : never)>;
export declare const deserializeExit: <A extends Schema.Top, E extends Schema.Top>(self: Persistable<A, E>, encoded: unknown): Effect.Effect<Exit.Exit<A["Type"], E["Type"]>, Schema.SchemaError, A["DecodingServices"] | E["DecodingServices"]>;
export declare const exitSchema: <A extends Schema.Top, E extends Schema.Top>(self: Persistable<A, E>): Schema.Exit<A, E, Schema.Defect>;
export declare const serializeExit: <A extends Schema.Top, E extends Schema.Top>(self: Persistable<A, E>, exit: Exit.Exit<A["Type"], E["Type"]>): Effect.Effect<unknown, Schema.SchemaError, A["EncodingServices"] | E["EncodingServices"]>;
```

## Other Exports (Non-Function)

- `Any` (type)
- `DecodingServices` (type)
- `EncodingServices` (type)
- `Error` (type)
- `ErrorSchema` (type)
- `Persistable` (interface)
- `Services` (type)
- `Success` (type)
- `SuccessSchema` (type)
- `symbol` (variable)
- `TimeToLiveFn` (type)
