# API Reference: effect/unstable/httpapi/HttpApiSecurity

- Import path: `effect/unstable/httpapi/HttpApiSecurity`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiSecurity.ts`
- Function exports (callable): 3
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `annotate`
- `annotateMerge`
- `apiKey`

## All Function Signatures

```ts
export declare const annotate: <I, S>(service: ServiceMap.Service<I, S>, value: S): <A extends HttpApiSecurity>(self: A) => A; // overload 1
export declare const annotate: <A extends HttpApiSecurity, I, S>(self: A, service: ServiceMap.Service<I, S>, value: S): A; // overload 2
export declare const annotateMerge: <I>(annotations: ServiceMap.ServiceMap<I>): <A extends HttpApiSecurity>(self: A) => A; // overload 1
export declare const annotateMerge: <A extends HttpApiSecurity, I>(self: A, annotations: ServiceMap.ServiceMap<I>): A; // overload 2
export declare const apiKey: (options: { readonly key: string; readonly in?: "header" | "query" | "cookie" | undefined; }): ApiKey;
```

## Other Exports (Non-Function)

- `ApiKey` (interface)
- `basic` (variable)
- `Basic` (interface)
- `bearer` (variable)
- `Bearer` (interface)
- `Credentials` (interface)
- `HttpApiSecurity` (type)
