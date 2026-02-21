# API Reference: effect/unstable/http/HttpRouter

- Import path: `effect/unstable/http/HttpRouter`
- Source file: `packages/effect/src/unstable/http/HttpRouter.ts`
- Function exports (callable): 16
- Non-function exports: 13

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `addAll`
- `cors`
- `middleware`
- `prefixPath`
- `prefixRoute`
- `provideRequest`
- `route`
- `schemaJson`
- `schemaNoBody`
- `schemaParams`
- `schemaPathParams`
- `serve`
- `toHttpEffect`
- `toWebHandler`
- `use`

## All Function Signatures

```ts
export declare const add: <E = never, R = never>(method: "*" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS", path: PathInput, handler: HttpServerResponse.HttpServerResponse | Effect.Effect<HttpServerResponse.HttpServerResponse, E, R> | ((request: HttpServerRequest.HttpServerRequest) => Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>), options?: { readonly uninterruptible?: boolean | undefined; }): Layer.Layer<never, never, HttpRouter | Request.From<"Requires", Exclude<R, Provided>> | Request.From<"Error", E>>;
export declare const addAll: <Routes extends ReadonlyArray<Route<any, any>>, EX = never, RX = never>(routes: Routes | Effect.Effect<Routes, EX, RX>, options?: { readonly prefix?: string | undefined; }): Layer.Layer<never, EX, HttpRouter | Exclude<RX, Scope.Scope> | Request.From<"Requires", Exclude<Route.Context<Routes[number]>, Provided>> | Request.From<"Error", Route.Error<Routes[number]>>>;
export declare const cors: (options?: { readonly allowedOrigins?: ReadonlyArray<string> | undefined; readonly allowedMethods?: ReadonlyArray<string> | undefined; readonly allowedHeaders?: ReadonlyArray<string> | undefined; readonly exposedHeaders?: ReadonlyArray<string> | undefined; readonly maxAge?: number | undefined; readonly credentials?: boolean | undefined; } | undefined): Layer.Layer<never, never, HttpRouter>;
export declare const middleware: <E, R, EX, RX, const Global extends boolean = false>(middleware: Effect.Effect<(effect: Effect.Effect<HttpServerResponse.HttpServerResponse, Types.unhandled, never>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E, R> & (Types.unhandled extends E ? unknown : "You must only handle the configured errors"), EX, RX>, options?: { readonly global?: Global | undefined; } | undefined): Global extends true ? Layer.Layer<never, EX, HttpRouter | Exclude<RX, Scope.Scope> | Request<Kind extends string, T>.From<"GlobalRequires", Exclude<R, GlobalProvided>> | Request.From<"GlobalError", Exclude<E, Types.unhandled>>> : Middleware<{ provides: never; handles: never; error: Exclude<E, Types.unhandled>; requires: Exclude<R, Provided>; layerError: EX; layerRequires: Exclude<RX, Scope.Scope>; }>; // overload 1
export declare const middleware: <E, R, const Global extends boolean = false>(middleware: ((effect: Effect.Effect<HttpServerResponse.HttpServerResponse, Types.unhandled, never>) => Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) & (Types.unhandled extends E ? unknown : "You must only handle the configured errors"), options?: { readonly global?: Global | undefined; } | undefined): Global extends true ? Layer.Layer<never, never, HttpRouter | Request<Kind extends string, T>.From<"GlobalRequires", Exclude<R, GlobalProvided>> | Request.From<"GlobalError", Exclude<E, Types.unhandled>>> : Middleware<{ provides: never; handles: never; error: Exclude<E, Types.unhandled>; requires: Exclude<R, Provided>; layerError: never; layerRequires: never; }>; // overload 2
export declare const middleware: <Config extends { provides?: any; handles?: any; } = {}>(): middleware.Make<Config extends { provides: infer R; } ? R : never, Config extends { handles: infer E; } ? E : never>; // overload 3
export declare const prefixPath: (prefix: string): (self: string) => string; // overload 1
export declare const prefixPath: (self: string, prefix: string): string; // overload 2
export declare const prefixRoute: (prefix: string): <E, R>(self: Route<E, R>) => Route<E, R>; // overload 1
export declare const prefixRoute: <E, R>(self: Route<E, R>, prefix: string): Route<E, R>; // overload 2
export declare const provideRequest: <A2, E2, R2>(layer: Layer.Layer<A2, E2, R2>): <A, E, R>(self: Layer.Layer<A, E, R>) => Layer.Layer<A, E | E2, R2 | Exclude<R, Request.From<"Requires", A2>>>;
export declare const route: <E = never, R = never>(method: "*" | HttpMethod.HttpMethod, path: PathInput, handler: HttpServerResponse.HttpServerResponse | Effect.Effect<HttpServerResponse.HttpServerResponse, E, R> | ((request: HttpServerRequest.HttpServerRequest) => Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>), options?: { readonly uninterruptible?: boolean | undefined; }): Route<E, Exclude<R, Provided>>;
export declare const schemaJson: <A, I extends Partial<{ readonly method: HttpMethod.HttpMethod; readonly url: string; readonly cookies: Readonly<Record<string, string | undefined>>; readonly headers: Readonly<Record<string, string | undefined>>; readonly pathParams: Readonly<Record<string, string | undefined>>; readonly searchParams: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>; readonly body: any; }>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, HttpServerError.HttpServerError | Schema.SchemaError, HttpServerRequest.HttpServerRequest | HttpServerRequest.ParsedSearchParams | RouteContext | RD>;
export declare const schemaNoBody: <A, I extends Partial<{ readonly method: HttpMethod.HttpMethod; readonly url: string; readonly cookies: Readonly<Record<string, string | undefined>>; readonly headers: Readonly<Record<string, string | undefined>>; readonly pathParams: Readonly<Record<string, string | undefined>>; readonly searchParams: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>; }>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, HttpServerRequest.HttpServerRequest | HttpServerRequest.ParsedSearchParams | RouteContext | RD>;
export declare const schemaParams: <A, I extends Readonly<Record<string, string | ReadonlyArray<string> | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, HttpServerRequest.ParsedSearchParams | RouteContext | RD>;
export declare const schemaPathParams: <A, I extends Readonly<Record<string, string | undefined>>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): Effect.Effect<A, Schema.SchemaError, RouteContext | RD>;
export declare const serve: <A, E, R, HE, HR = Request.Only<"Requires", R> | Request.Only<"GlobalRequires", R>>(appLayer: Layer.Layer<A, E, R>, options?: { readonly routerConfig?: Partial<FindMyWay.RouterConfig> | undefined; readonly disableLogger?: boolean | undefined; readonly disableListenLog?: boolean; readonly middleware?: (effect: Effect.Effect<HttpServerResponse.HttpServerResponse, Request.Only<"Error", R> | Request.Only<"GlobalError", R> | HttpServerError.HttpServerError, Scope.Scope | HttpServerRequest.HttpServerRequest | Request.Only<"Requires", R> | Request.Only<"GlobalRequires", R>>) => Effect.Effect<HttpServerResponse.HttpServerResponse, HE, HR>; }): Layer.Layer<A, Request.Without<E>, HttpServer.HttpServer | Exclude<Request.Without<R> | Exclude<HR, GlobalProvided>, HttpRouter>>;
export declare const toHttpEffect: <A, E, R>(appLayer: Layer.Layer<A, E, R>): Effect.Effect<Effect.Effect<HttpServerResponse.HttpServerResponse, Request.Only<"Error", R> | Request.Only<"GlobalRequires", R> | HttpServerError.HttpServerError, Scope.Scope | HttpServerRequest.HttpServerRequest | Request.Only<"Requires", R> | Request.Only<"GlobalRequires", R>>, Request.Without<E>, Exclude<Request.Without<R>, HttpRouter> | Scope.Scope>;
export declare const toWebHandler: <A, E, R extends HttpRouter | Request<"Requires", any> | Request<"GlobalRequires", any> | Request<"Error", any> | Request<"GlobalError", any>, HE, HR = Exclude<Request.Only<"Requires", R>, A> | Exclude<Request.Only<"GlobalRequires", R>, A>>(appLayer: Layer.Layer<A, E, R>, options?: { readonly memoMap?: Layer.MemoMap | undefined; readonly routerConfig?: Partial<FindMyWay.RouterConfig> | undefined; readonly disableLogger?: boolean | undefined; readonly middleware?: (effect: Effect.Effect<HttpServerResponse.HttpServerResponse, Request.Only<"Error", R> | Request.Only<"GlobalError", R> | HttpServerError.HttpServerError, Scope.Scope | HttpServerRequest.HttpServerRequest | Request.Only<"Requires", R> | Request.Only<"GlobalRequires", R>>) => Effect.Effect<HttpServerResponse.HttpServerResponse, HE, HR>; }): { readonly handler: [HR] extends [never] ? ((request: globalThis.Request, context?: ServiceMap.ServiceMap<never> | undefined) => Promise<Response>) : ((request: globalThis.Request, context: ServiceMap.ServiceMap<HR>) => Promise<Response>); readonly dispose: () => Promise<void>; };
export declare const use: <A, E, R>(f: (router: HttpRouter) => Effect.Effect<A, E, R>): Layer.Layer<never, E, HttpRouter | Exclude<R, Scope.Scope>>;
```

## Other Exports (Non-Function)

- `disableLogger` (variable)
- `GlobalProvided` (type)
- `HttpRouter` (interface)
- `layer` (variable)
- `make` (variable)
- `Middleware` (interface)
- `params` (variable)
- `PathInput` (type)
- `Provided` (type)
- `Request` (interface)
- `Route` (interface)
- `RouteContext` (class)
- `RouterConfig` (variable)
