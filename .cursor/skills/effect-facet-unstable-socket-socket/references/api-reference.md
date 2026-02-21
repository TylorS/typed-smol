# API Reference: effect/unstable/socket/Socket

- Import path: `effect/unstable/socket/Socket`
- Source file: `packages/effect/src/unstable/socket/Socket.ts`
- Function exports (callable): 14
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `defaultCloseCodeIsError`
- `fromTransformStream`
- `fromWebSocket`
- `isCloseEvent`
- `isSocket`
- `isSocketError`
- `layerWebSocket`
- `makeChannel`
- `makeWebSocket`
- `makeWebSocketChannel`
- `toChannel`
- `toChannelMap`
- `toChannelString`
- `toChannelWith`

## All Function Signatures

```ts
export declare const defaultCloseCodeIsError: (code: number): boolean;
export declare const fromTransformStream: <R>(acquire: Effect.Effect<InputTransformStream, SocketError, R>, options?: { readonly closeCodeIsError?: (code: number) => boolean; }): Effect.Effect<Socket, never, Exclude<R, Scope.Scope>>;
export declare const fromWebSocket: <RO>(acquire: Effect.Effect<globalThis.WebSocket, SocketError, RO>, options?: { readonly closeCodeIsError?: ((code: number) => boolean) | undefined; readonly openTimeout?: Duration.Input | undefined; } | undefined): Effect.Effect<Socket, never, Exclude<RO, Scope.Scope>>;
export declare const isCloseEvent: (u: unknown): u is CloseEvent;
export declare const isSocket: (u: unknown): u is Socket;
export declare const isSocketError: (u: unknown): u is SocketError;
export declare const layerWebSocket: (url: string | Effect.Effect<string>, options?: { readonly closeCodeIsError?: ((code: number) => boolean) | undefined; readonly openTimeout?: Duration.Input | undefined; readonly protocols?: string | Array<string> | undefined; } | undefined): Layer.Layer<Socket, never, WebSocketConstructor>;
export declare const makeChannel: <IE = never>(): Channel.Channel<NonEmptyReadonlyArray<Uint8Array>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE, unknown, Socket>;
export declare const makeWebSocket: (url: string | Effect.Effect<string>, options?: { readonly closeCodeIsError?: ((code: number) => boolean) | undefined; readonly openTimeout?: Duration.Input | undefined; readonly protocols?: string | Array<string> | undefined; }): Effect.Effect<Socket, never, WebSocketConstructor>;
export declare const makeWebSocketChannel: <IE = never>(url: string, options?: { readonly closeCodeIsError?: (code: number) => boolean; }): Channel.Channel<NonEmptyReadonlyArray<Uint8Array>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE, unknown, WebSocketConstructor>;
export declare const toChannel: <IE>(self: Socket): Channel.Channel<NonEmptyReadonlyArray<Uint8Array>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE>;
export declare const toChannelMap: <IE, A>(self: Socket, f: (data: Uint8Array | string) => A): Channel.Channel<NonEmptyReadonlyArray<A>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE>;
export declare const toChannelString: (encoding?: string | undefined): <IE>(self: Socket) => Channel.Channel<NonEmptyReadonlyArray<string>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE>; // overload 1
export declare const toChannelString: <IE>(self: Socket, encoding?: string | undefined): Channel.Channel<NonEmptyReadonlyArray<string>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE>; // overload 2
export declare const toChannelWith: <IE = never>(): (self: Socket) => Channel.Channel<NonEmptyReadonlyArray<Uint8Array>, SocketError | IE, void, NonEmptyReadonlyArray<Uint8Array | string | CloseEvent>, IE>;
```

## Other Exports (Non-Function)

- `CloseEvent` (class)
- `InputTransformStream` (interface)
- `layerWebSocketConstructorGlobal` (variable)
- `SendQueueCapacity` (variable)
- `Socket` (interface)
- `SocketCloseError` (class)
- `SocketError` (class)
- `SocketErrorReason` (type)
- `SocketErrorTypeId` (type)
- `SocketOpenError` (class)
- `SocketReadError` (class)
- `SocketWriteError` (class)
- `TypeId` (variable)
- `WebSocket` (class)
- `WebSocketConstructor` (class)
