# API Reference: effect/unstable/httpapi/HttpApiMiddleware

- Import path: `effect/unstable/httpapi/HttpApiMiddleware`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiMiddleware.ts`
- Function exports (callable): 3
- Non-function exports: 17

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isSecurity`
- `layerClient`
- `Service`

## All Function Signatures

```ts
export declare const isSecurity: (u: AnyKey): u is AnyKeySecurity;
export declare const layerClient: <Id extends AnyId, S, R, EX = never, RX = never>(tag: ServiceMap.Service<Id, S>, service: HttpApiMiddlewareClient<Id[typeof TypeId]["error"]["Type"], Id[typeof TypeId]["clientError"], R> | Effect.Effect<HttpApiMiddlewareClient<Id[typeof TypeId]["error"]["Type"], Id[typeof TypeId]["clientError"], R>, EX, RX>): Layer.Layer<ForClient<Id>, EX, R | Exclude<RX, Scope>>;
export declare const Service: <Self, Config extends { requires?: any; provides?: any; clientError?: any; } = { requires: never; provides: never; clientError: never; }>(): <const Id extends string, Error extends Schema.Top = never, const Security extends Record<string, HttpApiSecurity.HttpApiSecurity> = never, RequiredForClient extends boolean = false>(id: Id, options?: { readonly error?: Error | undefined; readonly security?: Security | undefined; readonly requiredForClient?: RequiredForClient | undefined; } | undefined) => ServiceClass<Self, Id, { requires: "requires" extends keyof Config ? Config["requires"] : never; provides: "provides" extends keyof Config ? Config["provides"] : never; error: Error; clientError: "clientError" extends keyof Config ? Config["clientError"] : never; requiredForClient: RequiredForClient; security: Security; }>;
```

## Other Exports (Non-Function)

- `AnyId` (interface)
- `AnyKey` (interface)
- `AnyKeySecurity` (interface)
- `ApplyServices` (type)
- `ClientError` (type)
- `Error` (type)
- `ErrorSchema` (type)
- `ErrorServicesDecode` (type)
- `ErrorServicesEncode` (type)
- `ForClient` (interface)
- `HttpApiMiddleware` (type)
- `HttpApiMiddlewareClient` (interface)
- `HttpApiMiddlewareSecurity` (type)
- `MiddlewareClient` (type)
- `Provides` (type)
- `Requires` (type)
- `ServiceClass` (type)
