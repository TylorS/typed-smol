# API Reference: effect/unstable/http/HttpServerError

- Import path: `effect/unstable/http/HttpServerError`
- Source file: `packages/effect/src/unstable/http/HttpServerError.ts`
- Function exports (callable): 4
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `causeResponse`
- `causeResponseStripped`
- `exitResponse`
- `isHttpServerError`

## All Function Signatures

```ts
export declare const causeResponse: <E>(cause: Cause.Cause<E>): Effect.Effect<readonly [Response.HttpServerResponse, Cause.Cause<E>]>;
export declare const causeResponseStripped: <E>(cause: Cause.Cause<E>): readonly [response: Response.HttpServerResponse, cause: Cause.Cause<E> | undefined];
export declare const exitResponse: <E>(exit: Exit.Exit<Response.HttpServerResponse, E>): Response.HttpServerResponse;
export declare const isHttpServerError: (u: unknown): u is HttpServerError;
```

## Other Exports (Non-Function)

- `clientAbortFiberId` (variable)
- `HttpServerError` (class)
- `HttpServerErrorReason` (type)
- `InternalError` (class)
- `RequestError` (type)
- `RequestParseError` (class)
- `ResponseError` (class)
- `RouteNotFound` (class)
- `ServeError` (class)
