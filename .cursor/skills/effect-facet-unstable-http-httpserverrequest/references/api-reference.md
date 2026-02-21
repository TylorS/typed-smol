# API Reference: effect/unstable/http/HttpServerRequest

- Import path: `effect/unstable/http/HttpServerRequest`
- Source file: `packages/effect/src/unstable/http/HttpServerRequest.ts`
- Function exports (callable): 14
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromWeb`
- `schemaBodyForm`
- `schemaBodyFormJson`
- `schemaBodyJson`
- `schemaBodyMultipart`
- `schemaBodyUrlParams`
- `schemaCookies`
- `schemaHeaders`
- `schemaSearchParams`
- `searchParamsFromURL`
- `toURL`
- `toWeb`
- `toWebResult`
- `upgradeChannel`

## All Function Signatures

```ts
export declare const fromWeb: (request: globalThis.Request): HttpServerRequest;
export declare const schemaBodyForm: <A, I extends Partial<Multipart.Persisted>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError | HttpServerError | Multipart.MultipartError, Scope.Scope | FileSystem.FileSystem | Path.Path | HttpServerRequest | RD>;
export declare const schemaBodyFormJson: <A, I, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): (field: string) => Effect.Effect<A, Schema.SchemaError | HttpServerError, Scope.Scope | FileSystem.FileSystem | Path.Path | HttpServerRequest | RD>;
export declare const schemaBodyJson: <A, I, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, HttpServerError | Schema.SchemaError, HttpServerRequest | RD>;
export declare const schemaBodyMultipart: <A, I extends Partial<Multipart.Persisted>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Multipart.MultipartError | Schema.SchemaError, HttpServerRequest | Scope.Scope | FileSystem.FileSystem | Path.Path | RD>;
export declare const schemaBodyUrlParams: <A, I extends Readonly<Record<string, string | ReadonlyArray<string> | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, HttpServerError | Schema.SchemaError, HttpServerRequest | RD>;
export declare const schemaCookies: <A, I extends Readonly<Record<string, string | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, RD | HttpServerRequest>;
export declare const schemaHeaders: <A, I extends Readonly<Record<string, string | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, HttpServerRequest | RD>;
export declare const schemaSearchParams: <A, I extends Readonly<Record<string, string | ReadonlyArray<string> | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, ParsedSearchParams | RD>;
export declare const searchParamsFromURL: (url: URL): ReadonlyRecord<string, string | Array<string>>;
export declare const toURL: (self: HttpServerRequest): URL | undefined;
export declare const toWeb: (self: HttpServerRequest, options?: { readonly signal?: AbortSignal | undefined; }): Effect.Effect<Request, RequestError>;
export declare const toWebResult: (self: HttpServerRequest, options?: { readonly signal?: AbortSignal | undefined; readonly services?: ServiceMap.ServiceMap<never> | undefined; }): Result.Result<Request, RequestError>;
export declare const upgradeChannel: <IE = never>(): Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array>, HttpServerError | IE | Socket.SocketError, void, Arr.NonEmptyReadonlyArray<string | Uint8Array | Socket.CloseEvent>, IE, unknown, HttpServerRequest>;
```

## Other Exports (Non-Function)

- `HttpServerRequest` (interface)
- `MaxBodySize` (variable)
- `ParsedSearchParams` (class)
- `TypeId` (variable)
