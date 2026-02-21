# API Reference: effect/unstable/httpapi/HttpApiBuilder

- Import path: `effect/unstable/httpapi/HttpApiBuilder`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiBuilder.ts`
- Function exports (callable): 4
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `group`
- `layer`
- `securityDecode`
- `securitySetCookie`

## All Function Signatures

```ts
export declare const group: <ApiId extends string, Groups extends HttpApiGroup.Any, const Name extends HttpApiGroup.Name<Groups>, Return>(api: HttpApi.HttpApi<ApiId, Groups>, groupName: Name, build: (handlers: Handlers.FromGroup<HttpApiGroup.WithName<Groups, Name>>) => Handlers.ValidateReturn<Return>): Layer.Layer<HttpApiGroup.ApiGroup<ApiId, Name>, Handlers.Error<Return>, Exclude<Handlers.Context<Return>, Scope.Scope>>;
export declare const layer: <Id extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<Id, Groups>, options?: { readonly openapiPath?: `/${string}` | undefined; }): Layer.Layer<never, never, Etag.Generator | HttpRouter.HttpRouter | FileSystem | HttpPlatform | Path | HttpApiGroup.ToService<Id, Groups> | HttpApiGroup.ErrorServicesEncode<Groups>>;
export declare const securityDecode: <Security extends HttpApiSecurity.HttpApiSecurity>(self: Security): Effect.Effect<HttpApiSecurity.HttpApiSecurity.Type<Security>, never, HttpServerRequest | Request.ParsedSearchParams>;
export declare const securitySetCookie: (self: HttpApiSecurity.ApiKey, value: string | Redacted.Redacted, options?: Cookie["options"]): Effect.Effect<void>;
```

## Other Exports (Non-Function)

- `Handlers` (interface)
- `HandlersTypeId` (type)
