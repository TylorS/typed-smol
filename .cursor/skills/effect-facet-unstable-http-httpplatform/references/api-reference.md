# API Reference: effect/unstable/http/HttpPlatform

- Import path: `effect/unstable/http/HttpPlatform`
- Source file: `packages/effect/src/unstable/http/HttpPlatform.ts`
- Function exports (callable): 1
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`

## All Function Signatures

```ts
export declare const make: (impl: { readonly fileResponse: (path: string, status: number, statusText: string | undefined, headers: Headers.Headers, start: number, end: number | undefined, contentLength: number) => Response.HttpServerResponse; readonly fileWebResponse: (file: Body.HttpBody.FileLike, status: number, statusText: string | undefined, headers: Headers.Headers, options?: { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; }) => Response.HttpServerResponse; }): Effect.Effect<HttpPlatform["Service"], never, Etag.Generator | FileSystem.FileSystem>;
```

## Other Exports (Non-Function)

- `HttpPlatform` (class)
- `layer` (variable)
