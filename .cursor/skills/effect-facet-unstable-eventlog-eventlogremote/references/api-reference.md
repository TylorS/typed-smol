# API Reference: effect/unstable/eventlog/EventLogRemote

- Import path: `effect/unstable/eventlog/EventLogRemote`
- Source file: `packages/effect/src/unstable/eventlog/EventLogRemote.ts`
- Function exports (callable): 8
- Non-function exports: 17

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decodeRequest`
- `decodeResponse`
- `encodeRequest`
- `encodeResponse`
- `fromSocket`
- `fromWebSocket`
- `layerWebSocket`
- `layerWebSocketBrowser`

## All Function Signatures

```ts
export declare const decodeRequest: (input: unknown, options?: ParseOptions): Effect.Effect<ChunkedMessage | WriteEntries | RequestChanges | StopChanges | Ping, Schema.SchemaError, never>;
export declare const decodeResponse: (input: unknown, options?: ParseOptions): Effect.Effect<Hello | ChunkedMessage | Ack | Changes | Pong, Schema.SchemaError, never>;
export declare const encodeRequest: (input: unknown, options?: ParseOptions): Effect.Effect<Uint8Array<ArrayBuffer>, Schema.SchemaError, never>;
export declare const encodeResponse: (input: unknown, options?: ParseOptions): Effect.Effect<Uint8Array<ArrayBuffer>, Schema.SchemaError, never>;
export declare const fromSocket: (options?: { readonly disablePing?: boolean; }): Effect.Effect<EventLogRemote["Service"], never, Scope.Scope | EventLogEncryption | Socket.Socket>;
export declare const fromWebSocket: (url: string, options?: { readonly disablePing?: boolean; }): Effect.Effect<EventLogRemote["Service"], never, Scope.Scope | EventLogEncryption | Socket.WebSocketConstructor>;
export declare const layerWebSocket: (url: string, options?: { readonly disablePing?: boolean; }): Layer.Layer<never, never, Socket.WebSocketConstructor | EventLogEncryption>;
export declare const layerWebSocketBrowser: (url: string, options?: { readonly disablePing?: boolean; }): Layer.Layer<never>;
```

## Other Exports (Non-Function)

- `Ack` (class)
- `Changes` (class)
- `ChunkedMessage` (class)
- `EventLogRemote` (class)
- `EventLogRemoteError` (class)
- `Hello` (class)
- `Ping` (class)
- `Pong` (class)
- `ProtocolRequest` (variable)
- `ProtocolRequestMsgpack` (variable)
- `ProtocolResponse` (variable)
- `ProtocolResponseMsgpack` (variable)
- `RemoteAdditions` (class)
- `RemoteEntryChange` (variable)
- `RequestChanges` (class)
- `StopChanges` (class)
- `WriteEntries` (class)
