# API Reference: effect/unstable/http/HttpClientRequest

- Import path: `effect/unstable/http/HttpClientRequest`
- Source file: `packages/effect/src/unstable/http/HttpClientRequest.ts`
- Function exports (callable): 40
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `accept`
- `acceptJson`
- `appendUrl`
- `appendUrlParam`
- `appendUrlParams`
- `basicAuth`
- `bearerToken`
- `bodyFile`
- `bodyFormData`
- `bodyFormDataRecord`
- `bodyJson`
- `bodyJsonUnsafe`
- `bodyStream`
- `bodyText`
- `bodyUint8Array`
- `bodyUrlParams`
- `delete`
- `get`

## All Function Signatures

```ts
export declare const accept: (mediaType: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const accept: (self: HttpClientRequest, mediaType: string): HttpClientRequest; // overload 2
export declare const acceptJson: (self: HttpClientRequest): HttpClientRequest;
export declare const appendUrl: (path: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const appendUrl: (self: HttpClientRequest, path: string): HttpClientRequest; // overload 2
export declare const appendUrlParam: (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const appendUrlParam: (self: HttpClientRequest, key: string, value: string): HttpClientRequest; // overload 2
export declare const appendUrlParams: (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const appendUrlParams: (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest; // overload 2
export declare const basicAuth: (username: string | Redacted.Redacted, password: string | Redacted.Redacted): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const basicAuth: (self: HttpClientRequest, username: string | Redacted.Redacted, password: string | Redacted.Redacted): HttpClientRequest; // overload 2
export declare const bearerToken: (token: string | Redacted.Redacted): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bearerToken: (self: HttpClientRequest, token: string | Redacted.Redacted): HttpClientRequest; // overload 2
export declare const bodyFile: (path: string, options?: { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; readonly contentType?: string; }): (self: HttpClientRequest) => Effect.Effect<HttpClientRequest, PlatformError.PlatformError, FileSystem.FileSystem>; // overload 1
export declare const bodyFile: (self: HttpClientRequest, path: string, options?: { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; readonly contentType?: string; }): Effect.Effect<HttpClientRequest, PlatformError.PlatformError, FileSystem.FileSystem>; // overload 2
export declare const bodyFormData: (body: FormData): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyFormData: (self: HttpClientRequest, body: FormData): HttpClientRequest; // overload 2
export declare const bodyFormDataRecord: (entries: HttpBody.FormDataInput): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyFormDataRecord: (self: HttpClientRequest, entries: HttpBody.FormDataInput): HttpClientRequest; // overload 2
export declare const bodyJson: (body: unknown): (self: HttpClientRequest) => Effect.Effect<HttpClientRequest, HttpBody.HttpBodyError>; // overload 1
export declare const bodyJson: (self: HttpClientRequest, body: unknown): Effect.Effect<HttpClientRequest, HttpBody.HttpBodyError>; // overload 2
export declare const bodyJsonUnsafe: (body: unknown): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyJsonUnsafe: (self: HttpClientRequest, body: unknown): HttpClientRequest; // overload 2
export declare const bodyStream: (body: Stream.Stream<Uint8Array, unknown>, options?: { readonly contentType?: string | undefined; readonly contentLength?: number | undefined; } | undefined): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyStream: (self: HttpClientRequest, body: Stream.Stream<Uint8Array, unknown>, options?: { readonly contentType?: string | undefined; readonly contentLength?: number | undefined; } | undefined): HttpClientRequest; // overload 2
export declare const bodyText: (body: string, contentType?: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyText: (self: HttpClientRequest, body: string, contentType?: string): HttpClientRequest; // overload 2
export declare const bodyUint8Array: (body: Uint8Array, contentType?: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyUint8Array: (self: HttpClientRequest, body: Uint8Array, contentType?: string): HttpClientRequest; // overload 2
export declare const bodyUrlParams: (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const bodyUrlParams: (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest; // overload 2
export declare const delete: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const get: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const head: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const isHttpClientRequest: (u: unknown): u is HttpClientRequest;
export declare const make: <M extends HttpMethod>(method: M): (url: string | URL, options?: Options.NoUrl | undefined) => HttpClientRequest;
export declare const modify: (options: Options): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const modify: (self: HttpClientRequest, options: Options): HttpClientRequest; // overload 2
export declare const options: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const patch: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const post: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const prependUrl: (path: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const prependUrl: (self: HttpClientRequest, path: string): HttpClientRequest; // overload 2
export declare const put: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const removeHash: (self: HttpClientRequest): HttpClientRequest;
export declare const schemaBodyJson: <S extends Schema.Top>(schema: S, options?: ParseOptions | undefined): { (body: S["Type"]): (self: HttpClientRequest) => Effect.Effect<HttpClientRequest, HttpBody.HttpBodyError, S["EncodingServices"]>; (self: HttpClientRequest, body: S["Type"]): Effect.Effect<HttpClientRequest, HttpBody.HttpBodyError, S["EncodingServices"]>; };
export declare const setBody: (body: HttpBody.HttpBody): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setBody: (self: HttpClientRequest, body: HttpBody.HttpBody): HttpClientRequest; // overload 2
export declare const setHash: (hash: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setHash: (self: HttpClientRequest, hash: string): HttpClientRequest; // overload 2
export declare const setHeader: (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setHeader: (self: HttpClientRequest, key: string, value: string): HttpClientRequest; // overload 2
export declare const setHeaders: (input: Headers.Input): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setHeaders: (self: HttpClientRequest, input: Headers.Input): HttpClientRequest; // overload 2
export declare const setMethod: (method: HttpMethod): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setMethod: (self: HttpClientRequest, method: HttpMethod): HttpClientRequest; // overload 2
export declare const setUrl: (url: string | URL): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setUrl: (self: HttpClientRequest, url: string | URL): HttpClientRequest; // overload 2
export declare const setUrlParam: (key: string, value: string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setUrlParam: (self: HttpClientRequest, key: string, value: string): HttpClientRequest; // overload 2
export declare const setUrlParams: (input: UrlParams.Input): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const setUrlParams: (self: HttpClientRequest, input: UrlParams.Input): HttpClientRequest; // overload 2
export declare const toUrl: (self: HttpClientRequest): URL | undefined;
export declare const trace: (url: string | URL, options?: Options.NoUrl): HttpClientRequest;
export declare const updateUrl: (f: (url: string) => string): (self: HttpClientRequest) => HttpClientRequest; // overload 1
export declare const updateUrl: (self: HttpClientRequest, f: (url: string) => string): HttpClientRequest; // overload 2
```

## Other Exports (Non-Function)

- `empty` (variable)
- `HttpClientRequest` (interface)
- `Options` (interface)
