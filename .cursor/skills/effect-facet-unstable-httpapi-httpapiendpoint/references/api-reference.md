# API Reference: effect/unstable/httpapi/HttpApiEndpoint

- Import path: `effect/unstable/httpapi/HttpApiEndpoint`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiEndpoint.ts`
- Function exports (callable): 12
- Non-function exports: 45

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `delete`
- `get`
- `getErrorSchemas`
- `getPayloadSchemas`
- `getSuccessSchemas`
- `head`
- `isHttpApiEndpoint`
- `make`
- `options`
- `patch`
- `post`
- `put`

## All Function Signatures

```ts
export declare const delete: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends SuccessConstraint = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "DELETE", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const get: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends Record<string, Schema.Encoder<string | readonly string[] | undefined, unknown>> = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "GET", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const getErrorSchemas: (endpoint: AnyWithProps): [Schema.Top, ...Array<Schema.Top>];
export declare const getPayloadSchemas: (endpoint: AnyWithProps): Array<Schema.Top>;
export declare const getSuccessSchemas: (endpoint: AnyWithProps): [Schema.Top, ...Array<Schema.Top>];
export declare const head: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends Record<string, Schema.Encoder<string | readonly string[] | undefined, unknown>> = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "HEAD", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const isHttpApiEndpoint: (u: unknown): u is HttpApiEndpoint<any, any, any>;
export declare const make: <Method extends HttpMethod>(method: Method): <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends PayloadConstraint<Method> = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; }) => HttpApiEndpoint<Name, Method, Path, Params extends Schema.Struct.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends ReadonlyArray<Schema.Top> ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends ReadonlyArray<Schema.Top> ? Success[number] : Success, (Error extends ReadonlyArray<Schema.Top> ? Error[number] : Error) | typeof HttpApiSchemaError>;
export declare const options: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends Record<string, Schema.Encoder<string | readonly string[] | undefined, unknown>> = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "OPTIONS", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const patch: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends SuccessConstraint = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "PATCH", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const post: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends SuccessConstraint = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "POST", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
export declare const put: <const Name extends string, const Path extends HttpRouter.PathInput, Params extends ParamsConstraint = never, Query extends QueryConstraint = never, Payload extends SuccessConstraint = never, Headers extends HeadersConstraint = never, const Success extends SuccessConstraint = HttpApiSchema.NoContent, const Error extends ErrorConstraint = never>(name: Name, path: Path, options?: { readonly params?: Params | undefined; readonly query?: Query | undefined; readonly headers?: Headers | undefined; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; } | undefined): HttpApiEndpoint<Name, "PUT", Path, Params extends Schema.Struct<Fields extends Schema.Struct.Fields>.Fields ? Schema.Struct<Params> : Params, Query extends Schema.Struct.Fields ? Schema.Struct<Query> : Query, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload extends readonly Schema.Top[] ? Payload[number] : Payload, Headers extends Schema.Struct.Fields ? Schema.Struct<Headers> : Headers, Success extends readonly Schema.Top[] ? Success[number] : Success, typeof HttpApiSchemaError | (Error extends readonly Schema.Top[] ? Error[number] : Error), never, never>;
```

## Other Exports (Non-Function)

- `AddError` (type)
- `AddMiddleware` (type)
- `AddPrefix` (type)
- `Any` (interface)
- `AnyWithProps` (interface)
- `ClientRequest` (type)
- `ClientServices` (type)
- `Error` (type)
- `ErrorConstraint` (type)
- `Errors` (type)
- `ErrorServicesDecode` (type)
- `ErrorServicesEncode` (type)
- `ErrorsWithName` (type)
- `ExcludeName` (type)
- `ExcludeProvided` (type)
- `Handler` (type)
- `HandlerRaw` (type)
- `HandlerRawWithName` (type)
- `HandlerWithName` (type)
- `Headers` (type)
- `HeadersConstraint` (type)
- `HttpApiEndpoint` (interface)
- `Middleware` (type)
- `MiddlewareClient` (type)
- `MiddlewareError` (type)
- `MiddlewareProvides` (type)
- `MiddlewareServices` (type)
- `MiddlewareServicesWithName` (type)
- `MiddlewareWithName` (type)
- `Name` (type)
- `Params` (type)
- `ParamsConstraint` (type)
- `Payload` (type)
- `PayloadConstraint` (type)
- `PayloadMap` (type)
- `Query` (type)
- `QueryConstraint` (type)
- `Request` (type)
- `RequestRaw` (type)
- `ServerServices` (type)
- `ServerServicesWithName` (type)
- `Success` (type)
- `SuccessConstraint` (type)
- `SuccessWithName` (type)
- `WithName` (type)
