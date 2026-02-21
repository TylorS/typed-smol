# API Reference: effect/unstable/httpapi/HttpApiSwagger

- Import path: `effect/unstable/httpapi/HttpApiSwagger`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiSwagger.ts`
- Function exports (callable): 1
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`

## All Function Signatures

```ts
export declare const layer: <Id extends string, Groups extends HttpApiGroup.Any>(api: HttpApi.HttpApi<Id, Groups>, options?: { readonly path?: `/${string}` | undefined; }): Layer.Layer<never, never, HttpRouter.HttpRouter>;
```

## Other Exports (Non-Function)

- None
