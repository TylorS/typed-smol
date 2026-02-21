# API Reference: effect/unstable/encoding/Ndjson

- Import path: `effect/unstable/encoding/Ndjson`
- Source file: `packages/effect/src/unstable/encoding/Ndjson.ts`
- Function exports (callable): 12
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decode`
- `decodeSchema`
- `decodeSchemaString`
- `decodeString`
- `duplex`
- `duplexSchema`
- `duplexSchemaString`
- `duplexString`
- `encode`
- `encodeSchema`
- `encodeSchemaString`
- `encodeString`

## All Function Signatures

```ts
export declare const decode: <IE = never, Done = unknown>(options?: { readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, IE | NdjsonError, Done, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE, Done>;
export declare const decodeSchema: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>(options?: { readonly ignoreEmptyLines?: boolean | undefined; }) => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Type"]>, Schema.SchemaError | NdjsonError | IE, Done, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE, Done, S["DecodingServices"]>;
export declare const decodeSchemaString: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>(options?: { readonly ignoreEmptyLines?: boolean | undefined; }) => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Type"]>, Schema.SchemaError | NdjsonError | IE, Done, Arr.NonEmptyReadonlyArray<string>, IE, Done, S["DecodingServices"]>;
export declare const decodeString: <IE = never, Done = unknown>(options?: { readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, IE | NdjsonError, Done, Arr.NonEmptyReadonlyArray<string>, IE, Done>;
export declare const duplex: (options?: { readonly ignoreEmptyLines?: boolean | undefined; }): <R, IE, OE, OutDone, InDone>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OE, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE | NdjsonError, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, NdjsonError | OE, OutDone, Arr.NonEmptyReadonlyArray<unknown>, IE, InDone, R>; // overload 1
export declare const duplex: <R, IE, OE, OutDone, InDone>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OE, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE | NdjsonError, InDone, R>, options?: { readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, NdjsonError | OE, OutDone, Arr.NonEmptyReadonlyArray<unknown>, IE, InDone, R>; // overload 2
export declare const duplexSchema: <In extends Schema.Top, Out extends Schema.Top>(options: { readonly inputSchema: In; readonly outputSchema: Out; readonly ignoreEmptyLines?: boolean | undefined; }): <OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, NdjsonError | Schema.SchemaError | InErr, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, NdjsonError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 1
export declare const duplexSchema: <Out extends Schema.Top, In extends Schema.Top, OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, NdjsonError | Schema.SchemaError | InErr, InDone, R>, options: { readonly inputSchema: In; readonly outputSchema: Out; readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, NdjsonError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 2
export declare const duplexSchemaString: <In extends Schema.Top, Out extends Schema.Top>(options: { readonly inputSchema: In; readonly outputSchema: Out; readonly ignoreEmptyLines?: boolean | undefined; }): <OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<string>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<string>, NdjsonError | Schema.SchemaError | InErr, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, NdjsonError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 1
export declare const duplexSchemaString: <Out extends Schema.Top, In extends Schema.Top, OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<string>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<string>, NdjsonError | Schema.SchemaError | InErr, InDone, R>, options: { readonly inputSchema: In; readonly outputSchema: Out; readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, NdjsonError | Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 2
export declare const duplexString: (options?: { readonly ignoreEmptyLines?: boolean | undefined; }): <R, IE, OE, OutDone, InDone>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<string>, OE, OutDone, Arr.NonEmptyReadonlyArray<string>, IE | NdjsonError, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, NdjsonError | OE, OutDone, Arr.NonEmptyReadonlyArray<unknown>, IE, InDone, R>; // overload 1
export declare const duplexString: <R, IE, OE, OutDone, InDone>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<string>, OE, OutDone, Arr.NonEmptyReadonlyArray<string>, IE | NdjsonError, InDone, R>, options?: { readonly ignoreEmptyLines?: boolean | undefined; }): Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, NdjsonError | OE, OutDone, Arr.NonEmptyReadonlyArray<unknown>, IE, InDone, R>; // overload 2
export declare const encode: <IE = never, Done = unknown>(): Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, IE | NdjsonError, Done, Arr.NonEmptyReadonlyArray<unknown>, IE, Done>;
export declare const encodeSchema: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array<ArrayBuffer>>, NdjsonError | Schema.SchemaError | IE, Done, Arr.NonEmptyReadonlyArray<S["Type"]>, IE, Done, S["EncodingServices"]>;
export declare const encodeSchemaString: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<string>, NdjsonError | Schema.SchemaError | IE, Done, Arr.NonEmptyReadonlyArray<S["Type"]>, IE, Done, S["EncodingServices"]>;
export declare const encodeString: <IE = never, Done = unknown>(): Channel.Channel<Arr.NonEmptyReadonlyArray<string>, IE | NdjsonError, Done, Arr.NonEmptyReadonlyArray<unknown>, IE, Done>;
```

## Other Exports (Non-Function)

- `NdjsonError` (class)
