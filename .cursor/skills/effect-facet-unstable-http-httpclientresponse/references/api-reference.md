# API Reference: effect/unstable/http/HttpClientResponse

- Import path: `effect/unstable/http/HttpClientResponse`
- Source file: `packages/effect/src/unstable/http/HttpClientResponse.ts`
- Function exports (callable): 10
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `filterStatus`
- `filterStatusOk`
- `fromWeb`
- `matchStatus`
- `schemaBodyJson`
- `schemaBodyUrlParams`
- `schemaHeaders`
- `schemaJson`
- `schemaNoBody`
- `stream`

## All Function Signatures

```ts
export declare const filterStatus: (f: (status: number) => boolean): (self: HttpClientResponse) => Effect.Effect<HttpClientResponse, Error.HttpClientError>; // overload 1
export declare const filterStatus: (self: HttpClientResponse, f: (status: number) => boolean): Effect.Effect<HttpClientResponse, Error.HttpClientError>; // overload 2
export declare const filterStatusOk: (self: HttpClientResponse): Effect.Effect<HttpClientResponse, Error.HttpClientError>;
export declare const fromWeb: (request: HttpClientRequest.HttpClientRequest, source: Response): HttpClientResponse;
export declare const matchStatus: <const Cases extends { readonly [status: number]: (_: HttpClientResponse) => any; readonly "2xx"?: (_: HttpClientResponse) => any; readonly "3xx"?: (_: HttpClientResponse) => any; readonly "4xx"?: (_: HttpClientResponse) => any; readonly "5xx"?: (_: HttpClientResponse) => any; readonly orElse: (_: HttpClientResponse) => any; }>(cases: Cases): (self: HttpClientResponse) => Cases[keyof Cases] extends (_: any) => infer R ? Unify<R> : never; // overload 1
export declare const matchStatus: <const Cases extends { readonly [status: number]: (_: HttpClientResponse) => any; readonly "2xx"?: (_: HttpClientResponse) => any; readonly "3xx"?: (_: HttpClientResponse) => any; readonly "4xx"?: (_: HttpClientResponse) => any; readonly "5xx"?: (_: HttpClientResponse) => any; readonly orElse: (_: HttpClientResponse) => any; }>(self: HttpClientResponse, cases: Cases): Cases[keyof Cases] extends (_: any) => infer R ? Unify<R> : never; // overload 2
export declare const schemaBodyJson: <S extends Schema.Top>(schema: S, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<S["Type"], E | Schema.SchemaError, S["DecodingServices"]>;
export declare const schemaBodyUrlParams: <A, I extends Readonly<Record<string, string | ReadonlyArray<string> | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<A, E | Schema.SchemaError, RD>;
export declare const schemaHeaders: <A, I extends Readonly<Record<string, string | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): <E>(self: HttpIncomingMessage<E>) => Effect.Effect<A, Schema.SchemaError, RD>;
export declare const schemaJson: <A, I extends { readonly status?: number | undefined; readonly headers?: Readonly<Record<string, string | undefined>> | undefined; readonly body?: unknown; }, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): (self: HttpClientResponse) => Effect.Effect<A, Schema.SchemaError | Error.HttpClientError, RD>;
export declare const schemaNoBody: <A, I extends { readonly status?: number | undefined; readonly headers?: Readonly<Record<string, string>> | undefined; }, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): (self: HttpClientResponse) => Effect.Effect<A, Schema.SchemaError, RD>;
export declare const stream: <E, R>(effect: Effect.Effect<HttpClientResponse, E, R>): Stream.Stream<Uint8Array, Error.HttpClientError | E, R>;
```

## Other Exports (Non-Function)

- `HttpClientResponse` (interface)
- `TypeId` (variable)
