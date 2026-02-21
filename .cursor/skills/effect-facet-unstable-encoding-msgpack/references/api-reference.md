# API Reference: effect/unstable/encoding/Msgpack

- Import path: `effect/unstable/encoding/Msgpack`
- Source file: `packages/effect/src/unstable/encoding/Msgpack.ts`
- Function exports (callable): 7
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decode`
- `decodeSchema`
- `duplex`
- `duplexSchema`
- `encode`
- `encodeSchema`
- `schema`

## All Function Signatures

```ts
export declare const decode: <IE = never, Done = unknown>(): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, IE | MsgPackError, Done, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE, Done>;
export declare const decodeSchema: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Type"]>, Schema.SchemaError | MsgPackError | IE, Done, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE, Done, S["DecodingServices"]>;
export declare const duplex: <R, IE, OE, OutDone, InDone>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OE, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE | MsgPackError, InDone, R>): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, MsgPackError | OE, OutDone, Arr.NonEmptyReadonlyArray<unknown>, IE, InDone, R>;
export declare const duplexSchema: <In extends Schema.Top, Out extends Schema.Top>(options: { readonly inputSchema: In; readonly outputSchema: Out; }): <OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, MsgPackError | Schema.SchemaError | InErr, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, MsgPackError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 1
export declare const duplexSchema: <Out extends Schema.Top, In extends Schema.Top, OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, MsgPackError | Schema.SchemaError | InErr, InDone, R>, options: { readonly inputSchema: In; readonly outputSchema: Out; }): Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, MsgPackError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 2
export declare const encode: <IE = never, Done = unknown>(): Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE | MsgPackError, Done, Arr.NonEmptyReadonlyArray<unknown>, IE, Done>;
export declare const encodeSchema: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, MsgPackError | Schema.SchemaError | IE, Done, Arr.NonEmptyReadonlyArray<S["Type"]>, IE, Done, S["EncodingServices"]>;
export declare const schema: <S extends Schema.Top>(schema: S): schema<S>;
```

## Other Exports (Non-Function)

- `MsgPackError` (class)
- `transformation` (variable)
