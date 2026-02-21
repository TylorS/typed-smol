# API Reference: effect/unstable/rpc/RpcMiddleware

- Import path: `effect/unstable/rpc/RpcMiddleware`
- Source file: `packages/effect/src/unstable/rpc/RpcMiddleware.ts`
- Function exports (callable): 2
- Non-function exports: 17

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerClient`
- `Service`

## All Function Signatures

```ts
export declare const layerClient: <Id extends AnyId, S, R, EX = never, RX = never>(tag: ServiceMap.Service<Id, S>, service: RpcMiddlewareClient<Id[TypeId]["error"]["Type"], Id[TypeId]["clientError"], R> | Effect.Effect<RpcMiddlewareClient<Id[TypeId]["error"]["Type"], Id[TypeId]["clientError"], R>, EX, RX>): Layer.Layer<ForClient<Id>, EX, R | Exclude<RX, Scope>>;
export declare const Service: <Self, Config extends { requires?: any; provides?: any; clientError?: any; } = { requires: never; provides: never; clientError: never; }>(): <const Name extends string, Error extends Schema.Top = Schema.Never, RequiredForClient extends boolean = false>(id: Name, options?: { readonly error?: Error | undefined; readonly requiredForClient: RequiredForClient | undefined; } | undefined) => ServiceClass<Self, Name, "provides" extends keyof Config ? Config["provides"] : never, Error, "clientError" extends keyof Config ? Config["clientError"] : never, "requires" extends keyof Config ? Config["requires"] : never>;
```

## Other Exports (Non-Function)

- `Any` (interface)
- `AnyId` (interface)
- `AnyService` (interface)
- `AnyServiceWithProps` (interface)
- `ApplyServices` (type)
- `Error` (type)
- `ErrorSchema` (type)
- `ErrorServicesDecode` (type)
- `ErrorServicesEncode` (type)
- `ForClient` (interface)
- `Provides` (type)
- `Requires` (type)
- `RpcMiddleware` (interface)
- `RpcMiddlewareClient` (interface)
- `ServiceClass` (interface)
- `SuccessValue` (interface)
- `TypeId` (type)
