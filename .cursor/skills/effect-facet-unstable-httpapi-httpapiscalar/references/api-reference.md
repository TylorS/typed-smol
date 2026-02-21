# API Reference: effect/unstable/httpapi/HttpApiScalar

- Import path: `effect/unstable/httpapi/HttpApiScalar`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiScalar.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `layerCdn`

## All Function Signatures

```ts
export declare const layer: <Id extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<Id, Groups>, options?: { readonly path?: `/${string}` | undefined; readonly scalar?: ScalarConfig; } | undefined): Layer.Layer<never, never, HttpRouter.HttpRouter>;
export declare const layerCdn: <Id extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<Id, Groups>, options?: { readonly path?: `/${string}` | undefined; readonly scalar?: ScalarConfig; readonly version?: string | undefined; } | undefined): Layer.Layer<never, never, HttpRouter.HttpRouter>;
```

## Other Exports (Non-Function)

- `ScalarConfig` (type)
- `ScalarThemeId` (type)
