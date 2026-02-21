# API Reference: effect/unstable/http/HttpMiddleware

- Import path: `effect/unstable/http/HttpMiddleware`
- Source file: `packages/effect/src/unstable/http/HttpMiddleware.ts`
- Function exports (callable): 8
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `cors`
- `layerTracerDisabledForUrls`
- `logger`
- `make`
- `searchParamsParser`
- `tracer`
- `withLoggerDisabled`
- `xForwardedHeaders`

## All Function Signatures

```ts
export declare const cors: (options?: { readonly allowedOrigins?: ReadonlyArray<string> | Predicate<string> | undefined; readonly allowedMethods?: ReadonlyArray<string> | undefined; readonly allowedHeaders?: ReadonlyArray<string> | undefined; readonly exposedHeaders?: ReadonlyArray<string> | undefined; readonly maxAge?: number | undefined; readonly credentials?: boolean | undefined; }): <E, R>(httpApp: Effect.Effect<HttpServerResponse, E, R>) => Effect.Effect<HttpServerResponse, E, R | HttpServerRequest>;
export declare const layerTracerDisabledForUrls: (urls: ReadonlyArray<string>): Layer.Layer<never>;
export declare const logger: <E, R>(httpApp: Effect.Effect<HttpServerResponse, E, HttpServerRequest | R>): Effect.Effect<HttpServerResponse, E, HttpServerRequest | R>;
export declare const make: <M extends HttpMiddleware>(middleware: M): M;
export declare const searchParamsParser: <E, R>(httpApp: Effect.Effect<HttpServerResponse, E, R>): Effect.Effect<Response.HttpServerResponse, E, HttpServerRequest | Exclude<R, Request.ParsedSearchParams>>;
export declare const tracer: <E, R>(httpApp: Effect.Effect<HttpServerResponse, E, HttpServerRequest | R>): Effect.Effect<HttpServerResponse, E, HttpServerRequest | R>;
export declare const withLoggerDisabled: <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
export declare const xForwardedHeaders: <E, R>(httpApp: Effect.Effect<Response.HttpServerResponse, E, HttpServerRequest | R>): Effect.Effect<Response.HttpServerResponse, E, HttpServerRequest | R>;
```

## Other Exports (Non-Function)

- `HttpMiddleware` (interface)
- `LoggerDisabled` (variable)
- `SpanNameGenerator` (variable)
- `TracerDisabledWhen` (variable)
