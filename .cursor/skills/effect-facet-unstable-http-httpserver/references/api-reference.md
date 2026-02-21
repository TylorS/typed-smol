# API Reference: effect/unstable/http/HttpServer

- Import path: `effect/unstable/http/HttpServer`
- Source file: `packages/effect/src/unstable/http/HttpServer.ts`
- Function exports (callable): 6
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `addressFormattedWith`
- `formatAddress`
- `make`
- `serve`
- `serveEffect`
- `withLogAddress`

## All Function Signatures

```ts
export declare const addressFormattedWith: <A, E, R>(f: (address: string) => Effect.Effect<A, E, R>): Effect.Effect<A, E, HttpServer | R>;
export declare const formatAddress: (address: Address): string;
export declare const make: (options: { readonly serve: (httpEffect: Effect.Effect<HttpServerResponse, unknown, HttpServerRequest | Scope.Scope>, middleware?: Middleware.HttpMiddleware) => Effect.Effect<void, never, Scope.Scope>; readonly address: Address; }): HttpServer["Service"];
export declare const serve: (): <E, R>(effect: Effect.Effect<HttpServerResponse, E, R>) => Layer.Layer<never, never, HttpServer | Exclude<R, HttpServerRequest | Scope.Scope>>; // overload 1
export declare const serve: <E, R, App extends Effect.Effect<HttpServerResponse, any, any>>(middleware: Middleware.HttpMiddleware.Applied<App, E, R>): (effect: Effect.Effect<HttpServerResponse, E, R>) => Layer.Layer<never, never, HttpServer | Exclude<Effect.Services<App>, HttpServerRequest | Scope.Scope>>; // overload 2
export declare const serve: <E, R>(effect: Effect.Effect<HttpServerResponse, E, R>): Layer.Layer<never, never, HttpServer | Exclude<R, HttpServerRequest | Scope.Scope>>; // overload 3
export declare const serve: <E, R, App extends Effect.Effect<HttpServerResponse, any, any>>(effect: Effect.Effect<HttpServerResponse, E, R>, middleware: Middleware.HttpMiddleware.Applied<App, E, R>): Layer.Layer<never, never, HttpServer | Exclude<Effect.Services<App>, HttpServerRequest | Scope.Scope>>; // overload 4
export declare const serveEffect: (): <E, R>(effect: Effect.Effect<HttpServerResponse, E, R>) => Effect.Effect<void, never, Scope.Scope | HttpServer | Exclude<R, HttpServerRequest>>; // overload 1
export declare const serveEffect: <E, R, App extends Effect.Effect<HttpServerResponse, any, any>>(middleware: Middleware.HttpMiddleware.Applied<App, E, R>): (effect: Effect.Effect<HttpServerResponse, E, R>) => Effect.Effect<void, never, Scope.Scope | HttpServer | Exclude<Effect.Services<App>, HttpServerRequest>>; // overload 2
export declare const serveEffect: <E, R>(effect: Effect.Effect<HttpServerResponse, E, R>): Effect.Effect<void, never, Scope.Scope | HttpServer | Exclude<R, HttpServerRequest>>; // overload 3
export declare const serveEffect: <E, R, App extends Effect.Effect<HttpServerResponse, any, any>>(effect: Effect.Effect<HttpServerResponse, E, R>, middleware: Middleware.HttpMiddleware.Applied<App, E, R>): Effect.Effect<void, never, Scope.Scope | HttpServer | Exclude<Effect.Services<App>, HttpServerRequest>>; // overload 4
export declare const withLogAddress: <A, E, R>(layer: Layer.Layer<A, E, R>): Layer.Layer<A, E, R | Exclude<HttpServer, A>>;
```

## Other Exports (Non-Function)

- `Address` (type)
- `HttpServer` (class)
- `layerServices` (variable)
- `layerTestClient` (variable)
- `logAddress` (variable)
- `makeTestClient` (variable)
- `TcpAddress` (interface)
- `UnixAddress` (interface)
