# API Reference: effect/unstable/http/HttpEffect

- Import path: `effect/unstable/http/HttpEffect`
- Source file: `packages/effect/src/unstable/http/HttpEffect.ts`
- Function exports (callable): 10
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `appendPreResponseHandler`
- `fromWebHandler`
- `scopeDisableClose`
- `scopeTransferToStream`
- `toHandled`
- `toWebHandler`
- `toWebHandlerLayer`
- `toWebHandlerLayerWith`
- `toWebHandlerWith`
- `withPreResponseHandler`

## All Function Signatures

```ts
export declare const appendPreResponseHandler: (handler: PreResponseHandler): Effect.Effect<void>;
export declare const fromWebHandler: (handler: (request: Request) => Promise<Response>): Effect.Effect<HttpServerResponse, HttpServerError, HttpServerRequest>;
export declare const scopeDisableClose: (scope: Scope.Scope): void;
export declare const scopeTransferToStream: (response: HttpServerResponse): HttpServerResponse;
export declare const toHandled: <E, R, EH, RH>(self: Effect.Effect<HttpServerResponse, E, R>, handleResponse: (request: HttpServerRequest, response: HttpServerResponse) => Effect.Effect<unknown, EH, RH>, middleware?: HttpMiddleware | undefined): Effect.Effect<void, never, Exclude<R | RH | HttpServerRequest, Scope.Scope>>;
export declare const toWebHandler: <E>(self: Effect.Effect<HttpServerResponse, E, HttpServerRequest | Scope.Scope>, middleware?: HttpMiddleware | undefined): (request: Request, services?: ServiceMap.ServiceMap<never> | undefined) => Promise<globalThis.Response>;
export declare const toWebHandlerLayer: <E, R, Provided, LE, ReqR = Exclude<R, Scope.Scope | HttpServerRequest | Provided>>(self: Effect.Effect<HttpServerResponse, E, R>, layer: Layer.Layer<Provided, LE>, options?: { readonly middleware?: HttpMiddleware | undefined; readonly memoMap?: Layer.MemoMap | undefined; } | undefined): { readonly dispose: () => Promise<void>; readonly handler: [ReqR] extends [never] ? (request: Request, services?: ServiceMap.ServiceMap<never> | undefined) => Promise<globalThis.Response> : (request: Request, services: ServiceMap.ServiceMap<ReqR>) => Promise<globalThis.Response>; };
export declare const toWebHandlerLayerWith: <E, Provided, LE, R, ReqR = Exclude<R, Scope.Scope | HttpServerRequest | Provided>>(layer: Layer.Layer<Provided, LE>, options: { readonly toHandler: (services: ServiceMap.ServiceMap<Provided>) => Effect.Effect<Effect.Effect<HttpServerResponse, E, R>, LE>; readonly middleware?: HttpMiddleware | undefined; readonly memoMap?: Layer.MemoMap | undefined; }): { readonly dispose: () => Promise<void>; readonly handler: [ReqR] extends [never] ? (request: Request, services?: ServiceMap.ServiceMap<never> | undefined) => Promise<globalThis.Response> : (request: Request, services: ServiceMap.ServiceMap<ReqR>) => Promise<globalThis.Response>; };
export declare const toWebHandlerWith: <Provided, R = never, ReqR = Exclude<R, Scope.Scope | HttpServerRequest | Provided>>(services: ServiceMap.ServiceMap<Provided>): <E>(self: Effect.Effect<HttpServerResponse, E, R>, middleware?: HttpMiddleware | undefined) => [ReqR] extends [never] ? (request: Request, services?: ServiceMap.ServiceMap<never> | undefined) => Promise<globalThis.Response> : (request: Request, services: ServiceMap.ServiceMap<ReqR>) => Promise<globalThis.Response>;
export declare const withPreResponseHandler: (handler: PreResponseHandler): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const withPreResponseHandler: <A, E, R>(self: Effect.Effect<A, E, R>, handler: PreResponseHandler): Effect.Effect<A, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `PreResponseHandler` (type)
- `PreResponseHandlers` (variable)
