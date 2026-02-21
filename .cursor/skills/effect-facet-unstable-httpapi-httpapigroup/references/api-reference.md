# API Reference: effect/unstable/httpapi/HttpApiGroup

- Import path: `effect/unstable/httpapi/HttpApiGroup`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiGroup.ts`
- Function exports (callable): 2
- Non-function exports: 18

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isHttpApiGroup`
- `make`

## All Function Signatures

```ts
export declare const isHttpApiGroup: (u: unknown): u is Any;
export declare const make: <const Id extends string, const TopLevel extends boolean = false>(identifier: Id, options?: { readonly topLevel?: TopLevel | undefined; }): HttpApiGroup<Id, never, TopLevel>;
```

## Other Exports (Non-Function)

- `AddMiddleware` (type)
- `AddPrefix` (type)
- `Any` (interface)
- `AnyWithProps` (type)
- `ApiGroup` (interface)
- `ClientServices` (type)
- `Endpoints` (type)
- `EndpointsWithName` (type)
- `ErrorServicesDecode` (type)
- `ErrorServicesEncode` (type)
- `HttpApiGroup` (interface)
- `MiddlewareClient` (type)
- `MiddlewareError` (type)
- `MiddlewareProvides` (type)
- `MiddlewareServices` (type)
- `Name` (type)
- `ToService` (type)
- `WithName` (type)
