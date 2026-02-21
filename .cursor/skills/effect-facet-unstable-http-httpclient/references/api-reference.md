# API Reference: effect/unstable/http/HttpClient

- Import path: `effect/unstable/http/HttpClient`
- Source file: `packages/effect/src/unstable/http/HttpClient.ts`
- Function exports (callable): 33
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `catch`
- `catchTag`
- `catchTags`
- `del`
- `execute`
- `filterOrElse`
- `filterOrFail`
- `filterStatus`
- `filterStatusOk`
- `followRedirects`
- `get`
- `head`
- `isHttpClient`
- `layerMergedServices`
- `make`
- `makeWith`
- `mapRequest`
- `mapRequestEffect`

## All Function Signatures

```ts
export declare const catch: <E, E2, R2>(f: (e: E) => Effect.Effect<HttpClientResponse.HttpClientResponse, E2, R2>): <R>(self: HttpClient.With<E, R>) => HttpClient.With<E2, R2 | R>; // overload 1
export declare const catch: <E, R, A2, E2, R2>(self: HttpClient.With<E, R>, f: (e: E) => Effect.Effect<A2, E2, R2>): HttpClient.With<E2, R | R2>; // overload 2
export declare const catchTag: <K extends Tags<E> | NonEmptyReadonlyArray<Tags<E>>, E, E1, R1>(tag: K, f: (e: ExtractTag<NoInfer<E>, K extends NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): <R>(self: HttpClient.With<E, R>) => HttpClient.With<E1 | ExcludeTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>, R1 | R>; // overload 1
export declare const catchTag: <R, E, K extends Tags<E> | NonEmptyReadonlyArray<Tags<E>>, R1, E1>(self: HttpClient.With<E, R>, tag: K, f: (e: ExtractTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): HttpClient.With<E1 | ExcludeTag<E, K extends NonEmptyReadonlyArray<string> ? K[number] : K>, R1 | R>; // overload 2
export declare const catchTags: <E, Cases extends { [K in Extract<E, { _tag: string; }>["_tag"]]+?: (error: Extract<E, { _tag: K; }>) => Effect.Effect<HttpClientResponse.HttpClientResponse, any, any>; } & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string; }>["_tag"]>]: never; })>(cases: Cases): <R>(self: HttpClient.With<E, R>) => HttpClient.With<Exclude<E, { _tag: keyof Cases; }> | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never; }[keyof Cases], R | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 1
export declare const catchTags: <E extends { _tag: string; }, R, Cases extends { [K in Extract<E, { _tag: string; }>["_tag"]]+?: (error: Extract<E, { _tag: K; }>) => Effect.Effect<HttpClientResponse.HttpClientResponse, any, any>; } & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string; }>["_tag"]>]: never; })>(self: HttpClient.With<E, R>, cases: Cases): HttpClient.With<Exclude<E, { _tag: keyof Cases; }> | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, infer E, any> ? E : never; }[keyof Cases], R | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect.Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 2
export declare const del: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const execute: (request: HttpClientRequest.HttpClientRequest): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const filterOrElse: <B extends HttpClientResponse.HttpClientResponse, E2, R2>(refinement: Predicate.Refinement<NoInfer<HttpClientResponse.HttpClientResponse>, B>, orElse: (response: EqualsWith<HttpClientResponse.HttpClientResponse, B, NoInfer<HttpClientResponse.HttpClientResponse>, Exclude<NoInfer<HttpClientResponse.HttpClientResponse>, B>>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E2 | E, R2 | R>; // overload 1
export declare const filterOrElse: <E2, R2>(predicate: Predicate.Predicate<NoInfer<HttpClientResponse.HttpClientResponse>>, orElse: (response: NoInfer<HttpClientResponse.HttpClientResponse>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E2 | E, R2 | R>; // overload 2
export declare const filterOrElse: <E, R, B extends HttpClientResponse.HttpClientResponse, E2, R2>(self: HttpClient.With<E, R>, refinement: Predicate.Refinement<HttpClientResponse.HttpClientResponse, B>, orElse: (response: EqualsWith<HttpClientResponse.HttpClientResponse, B, HttpClientResponse.HttpClientResponse, Exclude<HttpClientResponse.HttpClientResponse, B>>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E2, R2>): HttpClient.With<E2 | E, R2 | R>; // overload 3
export declare const filterOrElse: <E, R, E2, R2>(self: HttpClient.With<E, R>, predicate: Predicate.Predicate<HttpClientResponse.HttpClientResponse>, orElse: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<HttpClientResponse.HttpClientResponse, E2, R2>): HttpClient.With<E2 | E, R2 | R>; // overload 4
export declare const filterOrFail: <B extends HttpClientResponse.HttpClientResponse, E2>(refinement: Predicate.Refinement<NoInfer<HttpClientResponse.HttpClientResponse>, B>, orFailWith: (response: NoInfer<HttpClientResponse.HttpClientResponse>) => E2): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E2 | E, R>; // overload 1
export declare const filterOrFail: <E2>(predicate: Predicate.Predicate<NoInfer<HttpClientResponse.HttpClientResponse>>, orFailWith: (response: NoInfer<HttpClientResponse.HttpClientResponse>) => E2): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E2 | E, R>; // overload 2
export declare const filterOrFail: <E, R, B extends HttpClientResponse.HttpClientResponse, E2>(self: HttpClient.With<E, R>, refinement: Predicate.Refinement<NoInfer<HttpClientResponse.HttpClientResponse>, B>, orFailWith: (response: NoInfer<HttpClientResponse.HttpClientResponse>) => E2): HttpClient.With<E2 | E, R>; // overload 3
export declare const filterOrFail: <E, R, E2>(self: HttpClient.With<E, R>, predicate: Predicate.Predicate<NoInfer<HttpClientResponse.HttpClientResponse>>, orFailWith: (response: NoInfer<HttpClientResponse.HttpClientResponse>) => E2): HttpClient.With<E2 | E, R>; // overload 4
export declare const filterStatus: (f: (status: number) => boolean): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E | Error.HttpClientError, R>; // overload 1
export declare const filterStatus: <E, R>(self: HttpClient.With<E, R>, f: (status: number) => boolean): HttpClient.With<E | Error.HttpClientError, R>; // overload 2
export declare const filterStatusOk: <E, R>(self: HttpClient.With<E, R>): HttpClient.With<E | Error.HttpClientError, R>;
export declare const followRedirects: (maxRedirects?: number | undefined): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E, R>; // overload 1
export declare const followRedirects: <E, R>(self: HttpClient.With<E, R>, maxRedirects?: number | undefined): HttpClient.With<E, R>; // overload 2
export declare const get: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const head: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const isHttpClient: (u: unknown): u is HttpClient;
export declare const layerMergedServices: <E, R>(effect: Effect.Effect<HttpClient, E, R>): Layer.Layer<HttpClient, E, R>;
export declare const make: (f: (request: HttpClientRequest.HttpClientRequest, url: URL, signal: AbortSignal, fiber: Fiber<HttpClientResponse.HttpClientResponse, Error.HttpClientError>) => Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError>): HttpClient;
export declare const makeWith: <E2, R2, E, R>(postprocess: (request: Effect.Effect<HttpClientRequest.HttpClientRequest, E2, R2>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>, preprocess: HttpClient.Preprocess<E2, R2>): HttpClient.With<E, R>;
export declare const mapRequest: (f: (a: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E, R>; // overload 1
export declare const mapRequest: <E, R>(self: HttpClient.With<E, R>, f: (a: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest): HttpClient.With<E, R>; // overload 2
export declare const mapRequestEffect: <E2, R2>(f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientRequest.HttpClientRequest, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E | E2, R | R2>; // overload 1
export declare const mapRequestEffect: <E, R, E2, R2>(self: HttpClient.With<E, R>, f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientRequest.HttpClientRequest, E2, R2>): HttpClient.With<E | E2, R | R2>; // overload 2
export declare const mapRequestInput: (f: (a: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E, R>; // overload 1
export declare const mapRequestInput: <E, R>(self: HttpClient.With<E, R>, f: (a: HttpClientRequest.HttpClientRequest) => HttpClientRequest.HttpClientRequest): HttpClient.With<E, R>; // overload 2
export declare const mapRequestInputEffect: <E2, R2>(f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientRequest.HttpClientRequest, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E | E2, R | R2>; // overload 1
export declare const mapRequestInputEffect: <E, R, E2, R2>(self: HttpClient.With<E, R>, f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientRequest.HttpClientRequest, E2, R2>): HttpClient.With<E | E2, R | R2>; // overload 2
export declare const options: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const patch: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const post: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const put: (url: string | URL, options?: HttpClientRequest.Options.NoUrl | undefined): Effect.Effect<HttpClientResponse.HttpClientResponse, Error.HttpClientError, HttpClient>;
export declare const retry: <E, O extends NoExcessProperties<Effect.Retry.Options<E>, O>>(options: O): <R>(self: HttpClient.With<E, R>) => Retry.Return<R, E, O>; // overload 1
export declare const retry: <B, E, ES, R1>(policy: Schedule.Schedule<B, NoInfer<E>, ES, R1>): <R>(self: HttpClient.With<E, R>) => HttpClient.With<E | ES, R1 | R>; // overload 2
export declare const retry: <E, R, O extends NoExcessProperties<Effect.Retry.Options<E>, O>>(self: HttpClient.With<E, R>, options: O): Retry.Return<R, E, O>; // overload 3
export declare const retry: <E, R, B, ES, R1>(self: HttpClient.With<E, R>, policy: Schedule.Schedule<B, E, ES, R1>): HttpClient.With<E | ES, R1 | R>; // overload 4
export declare const retryTransient: <B, E, ES = never, R1 = never, const Mode extends "errors-only" | "response-only" | "both" = never, Input = "errors-only" extends Mode ? E : "response-only" extends Mode ? HttpClientResponse.HttpClientResponse : HttpClientResponse.HttpClientResponse | E>(options: { readonly mode?: Mode | undefined; readonly while?: Predicate.Predicate<NoInfer<E | ES>>; readonly schedule?: Schedule.Schedule<B, NoInfer<Input>, ES, R1>; readonly times?: number; } | Schedule.Schedule<B, NoInfer<Input>, ES, R1>): <R>(self: HttpClient.With<E, R>) => HttpClient.With<E | ES, R1 | R>; // overload 1
export declare const retryTransient: <E, R, B, ES = never, R1 = never, const Mode extends "errors-only" | "response-only" | "both" = never, Input = "errors-only" extends Mode ? E : "response-only" extends Mode ? HttpClientResponse.HttpClientResponse : HttpClientResponse.HttpClientResponse | E>(self: HttpClient.With<E, R>, options: { readonly mode?: Mode | undefined; readonly while?: Predicate.Predicate<NoInfer<E | ES>>; readonly schedule?: Schedule.Schedule<B, NoInfer<Input>, ES, R1>; readonly times?: number; } | Schedule.Schedule<B, NoInfer<Input>, ES, R1>): HttpClient.With<E | ES, R1 | R>; // overload 2
export declare const tap: <_, E2, R2>(f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<_, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E | E2, R | R2>; // overload 1
export declare const tap: <E, R, _, E2, R2>(self: HttpClient.With<E, R>, f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<_, E2, R2>): HttpClient.With<E | E2, R | R2>; // overload 2
export declare const tapError: <_, E, E2, R2>(f: (e: NoInfer<E>) => Effect.Effect<_, E2, R2>): <R>(self: HttpClient.With<E, R>) => HttpClient.With<E | E2, R | R2>; // overload 1
export declare const tapError: <E, R, _, E2, R2>(self: HttpClient.With<E, R>, f: (e: NoInfer<E>) => Effect.Effect<_, E2, R2>): HttpClient.With<E | E2, R | R2>; // overload 2
export declare const tapRequest: <_, E2, R2>(f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<_, E2, R2>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E | E2, R | R2>; // overload 1
export declare const tapRequest: <E, R, _, E2, R2>(self: HttpClient.With<E, R>, f: (a: HttpClientRequest.HttpClientRequest) => Effect.Effect<_, E2, R2>): HttpClient.With<E | E2, R | R2>; // overload 2
export declare const transform: <E, R, E1, R1>(f: (effect: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>, request: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): (self: HttpClient.With<E, R>) => HttpClient.With<E | E1, R | R1>; // overload 1
export declare const transform: <E, R, E1, R1>(self: HttpClient.With<E, R>, f: (effect: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>, request: HttpClientRequest.HttpClientRequest) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): HttpClient.With<E | E1, R | R1>; // overload 2
export declare const transformResponse: <E, R, E1, R1>(f: (effect: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): (self: HttpClient.With<E, R>) => HttpClient.With<E1, R1>; // overload 1
export declare const transformResponse: <E, R, E1, R1>(self: HttpClient.With<E, R>, f: (effect: Effect.Effect<HttpClientResponse.HttpClientResponse, E, R>) => Effect.Effect<HttpClientResponse.HttpClientResponse, E1, R1>): HttpClient.With<E1, R1>; // overload 2
export declare const withCookiesRef: (ref: Ref.Ref<Cookies.Cookies>): <E, R>(self: HttpClient.With<E, R>) => HttpClient.With<E, R>; // overload 1
export declare const withCookiesRef: <E, R>(self: HttpClient.With<E, R>, ref: Ref.Ref<Cookies.Cookies>): HttpClient.With<E, R>; // overload 2
export declare const withScope: <E, R>(self: HttpClient.With<E, R>): HttpClient.With<E, R | Scope.Scope>;
```

## Other Exports (Non-Function)

- `HttpClient` (interface)
- `Retry` (namespace)
- `SpanNameGenerator` (variable)
- `TracerDisabledWhen` (variable)
- `TracerPropagationEnabled` (variable)
