# API Reference: effect/unstable/encoding/Sse

- Import path: `effect/unstable/encoding/Sse`
- Source file: `packages/effect/src/unstable/encoding/Sse.ts`
- Function exports (callable): 6
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decode`
- `decodeDataSchema`
- `decodeSchema`
- `encode`
- `encodeSchema`
- `makeParser`

## All Function Signatures

```ts
export declare const decode: <IE, Done>(): Channel.Channel<NonEmptyReadonlyArray<Event>, IE | Retry, Done, NonEmptyReadonlyArray<string>, IE, Done>;
export declare const decodeDataSchema: <Type, DecodingServices, IE, Done>(schema: Schema.Decoder<Type, DecodingServices>): Channel.Channel<NonEmptyReadonlyArray<{ readonly event: string; readonly id: string | undefined; readonly data: Type; }>, IE | Retry | Schema.SchemaError, Done, NonEmptyReadonlyArray<string>, IE, Done, DecodingServices>;
export declare const decodeSchema: <Type extends { readonly id?: string | undefined; readonly event: string; readonly data: string; }, DecodingServices, IE, Done>(schema: Schema.Decoder<Type, DecodingServices>): Channel.Channel<NonEmptyReadonlyArray<Type>, IE | Retry | Schema.SchemaError, Done, NonEmptyReadonlyArray<string>, IE, Done, DecodingServices>;
export declare const encode: <IE, Done>(): Channel.Channel<NonEmptyReadonlyArray<string>, IE, void, NonEmptyReadonlyArray<Event>, IE | Retry, Done>;
export declare const encodeSchema: <S extends Schema.Encoder<{ readonly id?: string | undefined; readonly event: string; readonly data: string; }, unknown>, IE, Done>(schema: S): Channel.Channel<NonEmptyReadonlyArray<string>, IE | Schema.SchemaError, void, NonEmptyReadonlyArray<S["Type"]>, IE | Retry, Done, S["EncodingServices"]>;
export declare const makeParser: (onParse: (event: AnyEvent) => void): Parser;
```

## Other Exports (Non-Function)

- `AnyEvent` (type)
- `encoder` (variable)
- `Encoder` (interface)
- `Event` (interface)
- `EventEncoded` (interface)
- `Parser` (interface)
- `Retry` (class)
- `transformEvent` (variable)
