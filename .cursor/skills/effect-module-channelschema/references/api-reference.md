# API Reference: effect/ChannelSchema

- Import path: `effect/ChannelSchema`
- Source file: `packages/effect/src/ChannelSchema.ts`
- Function exports (callable): 6
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decode`
- `decodeUnknown`
- `duplex`
- `duplexUnknown`
- `encode`
- `encodeUnknown`

## All Function Signatures

```ts
export declare const decode: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Type"]>, IE | Schema.SchemaError, Done, Arr.NonEmptyReadonlyArray<S["Encoded"]>, IE, Done, S["DecodingServices"]>;
export declare const decodeUnknown: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Type"]>, IE | Schema.SchemaError, Done, Arr.NonEmptyReadonlyArray<S["Encoded"]>, IE, Done, S["DecodingServices"]>;
export declare const duplex: <In extends Schema.Top, Out extends Schema.Top>(options: { readonly inputSchema: In; readonly outputSchema: Out; }): <OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Encoded"]>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Encoded"]>, Schema.SchemaError | InErr, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 1
export declare const duplex: <Out extends Schema.Top, OutErr, OutDone, In extends Schema.Top, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Encoded"]>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Encoded"]>, Schema.SchemaError | InErr, InDone, R>, options: { readonly inputSchema: In; readonly outputSchema: Out; }): Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 2
export declare const duplexUnknown: <In extends Schema.Top, Out extends Schema.Top>(options: { readonly inputSchema: In; readonly outputSchema: Out; }): <OutErr, OutDone, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<any>, Schema.SchemaError | InErr, InDone, R>) => Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 1
export declare const duplexUnknown: <Out extends Schema.Top, OutErr, OutDone, In extends Schema.Top, InErr, InDone, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, OutErr, OutDone, Arr.NonEmptyReadonlyArray<any>, Schema.SchemaError | InErr, InDone, R>, options: { readonly inputSchema: In; readonly outputSchema: Out; }): Channel.Channel<Arr.NonEmptyReadonlyArray<Out["Type"]>, Schema.SchemaError | OutErr, OutDone, Arr.NonEmptyReadonlyArray<In["Type"]>, InErr, InDone, R | In["EncodingServices"] | Out["DecodingServices"]>; // overload 2
export declare const encode: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<S["Encoded"]>, IE | Schema.SchemaError, Done, Arr.NonEmptyReadonlyArray<S["Type"]>, IE, Done, S["EncodingServices"]>;
export declare const encodeUnknown: <S extends Schema.Top>(schema: S): <IE = never, Done = unknown>() => Channel.Channel<Arr.NonEmptyReadonlyArray<unknown>, IE | Schema.SchemaError, Done, Arr.NonEmptyReadonlyArray<S["Type"]>, IE, Done, S["EncodingServices"]>;
```

## Other Exports (Non-Function)

- None
