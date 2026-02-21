# API Reference: effect/unstable/reactivity/AtomHttpApi

- Import path: `effect/unstable/reactivity/AtomHttpApi`
- Source file: `packages/effect/src/unstable/reactivity/AtomHttpApi.ts`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Service`

## All Function Signatures

```ts
export declare const Service: <Self>(): <const Id extends string, ApiId extends string, Groups extends HttpApiGroup.Any>(id: Id, options: { readonly api: HttpApi.HttpApi<ApiId, Groups>; readonly httpClient: Layer.Layer<HttpApiGroup.ClientServices<Groups> | HttpClient.HttpClient>; readonly transformClient?: ((client: HttpClient.HttpClient) => HttpClient.HttpClient) | undefined; readonly transformResponse?: ((effect: Effect.Effect<unknown, unknown, unknown>) => Effect.Effect<unknown, unknown, unknown>) | undefined; readonly baseUrl?: URL | string | undefined; readonly runtime?: Atom.RuntimeFactory | undefined; }) => AtomHttpApiClient<Self, Id, Groups>;
```

## Other Exports (Non-Function)

- `AtomHttpApiClient` (interface)
