# API Reference: effect/unstable/http/HttpMethod

- Import path: `effect/unstable/http/HttpMethod`
- Source file: `packages/effect/src/unstable/http/HttpMethod.ts`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `hasBody`
- `isHttpMethod`

## All Function Signatures

```ts
export declare const hasBody: (method: HttpMethod): method is HttpMethod.WithBody;
export declare const isHttpMethod: (u: unknown): u is HttpMethod;
```

## Other Exports (Non-Function)

- `all` (variable)
- `allShort` (variable)
- `HttpMethod` (type)
