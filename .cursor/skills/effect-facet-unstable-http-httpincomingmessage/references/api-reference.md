# API Reference: effect/unstable/http/HttpIncomingMessage

- Import path: `effect/unstable/http/HttpIncomingMessage`
- Source file: `packages/effect/src/unstable/http/HttpIncomingMessage.ts`
- Function exports (callable): 5
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `inspect`
- `isHttpIncomingMessage`
- `schemaBodyJson`
- `schemaBodyUrlParams`
- `schemaHeaders`

## All Function Signatures

```ts
export declare const inspect: <E>(self: HttpIncomingMessage<E>, that: object): object;
export declare const isHttpIncomingMessage: (u: unknown): u is HttpIncomingMessage;
export declare const schemaBodyJson: <S extends Schema.Top>(schema: S, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<S["Type"], E | Schema.SchemaError, S["DecodingServices"]>;
export declare const schemaBodyUrlParams: <A, I extends Readonly<Record<string, string | ReadonlyArray<string> | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<A, E | Schema.SchemaError, RD>;
export declare const schemaHeaders: <A, I extends Readonly<Record<string, string | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<A, Schema.SchemaError, RD>;
```

## Other Exports (Non-Function)

- `HttpIncomingMessage` (interface)
- `MaxBodySize` (variable)
- `TypeId` (variable)
