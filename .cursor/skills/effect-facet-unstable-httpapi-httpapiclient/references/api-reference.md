# API Reference: effect/unstable/httpapi/HttpApiClient

- Import path: `effect/unstable/httpapi/HttpApiClient`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiClient.ts`
- Function exports (callable): 4
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `endpoint`
- `group`
- `make`
- `makeWith`

## All Function Signatures

```ts
export declare const endpoint: <ApiId extends string, Groups extends HttpApiGroup.Any, const GroupName extends HttpApiGroup.Name<Groups>, const EndpointName extends HttpApiEndpoint.Name<HttpApiGroup.EndpointsWithName<Groups, GroupName>>, E, R>(api: HttpApi.HttpApi<ApiId, Groups>, options: { readonly group: GroupName; readonly endpoint: EndpointName; readonly httpClient: HttpClient.HttpClient.With<E, R>; readonly transformClient?: ((client: HttpClient.HttpClient) => HttpClient.HttpClient) | undefined; readonly transformResponse?: ((effect: Effect.Effect<unknown, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>) | undefined; readonly baseUrl?: URL | string | undefined; }): Effect.Effect<Client.Method<HttpApiEndpoint.WithName<HttpApiGroup.Endpoints<HttpApiGroup.WithName<Groups, GroupName>>, EndpointName>, HttpApiSchemaError | E, R>, never, HttpApiEndpoint.MiddlewareClient<HttpApiEndpoint.WithName<HttpApiGroup.Endpoints<HttpApiGroup.WithName<Groups, GroupName>>, EndpointName>>>;
export declare const group: <ApiId extends string, Groups extends HttpApiGroup.Any, const GroupName extends HttpApiGroup.Name<Groups>, E, R>(api: HttpApi.HttpApi<ApiId, Groups>, options: { readonly group: GroupName; readonly httpClient: HttpClient.HttpClient.With<E, R>; readonly transformResponse?: ((effect: Effect.Effect<unknown, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>) | undefined; readonly baseUrl?: URL | string | undefined; }): Effect.Effect<Client.Group<Groups, GroupName, HttpApiSchemaError | E, R>, never, HttpApiGroup.MiddlewareClient<HttpApiGroup.WithName<Groups, GroupName>>>;
export declare const make: <ApiId extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<ApiId, Groups>, options?: { readonly transformClient?: ((client: HttpClient.HttpClient) => HttpClient.HttpClient) | undefined; readonly transformResponse?: ((effect: Effect.Effect<unknown, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>) | undefined; readonly baseUrl?: URL | string | undefined; }): Effect.Effect<Client<Groups, HttpApiSchemaError, never>, never, HttpClient.HttpClient | HttpApiGroup.MiddlewareClient<Groups>>;
export declare const makeWith: <ApiId extends string, Groups extends HttpApiGroup.Any, E, R>(api: HttpApi.HttpApi<ApiId, Groups>, options: { readonly httpClient: HttpClient.HttpClient.With<E, R>; readonly transformResponse?: ((effect: Effect.Effect<unknown, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>) | undefined; readonly baseUrl?: URL | string | undefined; }): Effect.Effect<Client<Groups, HttpApiSchemaError | E, R>, never, HttpApiGroup.MiddlewareClient<Groups>>;
```

## Other Exports (Non-Function)

- `Client` (type)
