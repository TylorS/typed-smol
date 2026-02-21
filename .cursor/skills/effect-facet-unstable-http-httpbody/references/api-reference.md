# API Reference: effect/unstable/http/HttpBody

- Import path: `effect/unstable/http/HttpBody`
- Source file: `packages/effect/src/unstable/http/HttpBody.ts`
- Function exports (callable): 13
- Non-function exports: 11

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `file`
- `fileFromInfo`
- `formData`
- `formDataRecord`
- `isHttpBody`
- `json`
- `jsonSchema`
- `jsonUnsafe`
- `raw`
- `stream`
- `text`
- `uint8Array`
- `urlParams`

## All Function Signatures

```ts
export declare const file: (path: string, options?: { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; readonly contentType?: string | undefined; }): Effect.Effect<Stream, PlatformError.PlatformError, FileSystem.FileSystem>;
export declare const fileFromInfo: (path: string, info: FileSystem.File.Info, options?: { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; readonly contentType?: string | undefined; }): Effect.Effect<Stream, PlatformError.PlatformError, FileSystem.FileSystem>;
export declare const formData: (body: globalThis.FormData): FormData;
export declare const formDataRecord: (entries: FormDataInput): FormData;
export declare const isHttpBody: (u: unknown): u is HttpBody;
export declare const json: (body: unknown, contentType?: string): Effect.Effect<Uint8Array, HttpBodyError>;
export declare const jsonSchema: <S extends Schema.Top>(schema: S, options?: ParseOptions | undefined): (body: S["Type"], contentType?: string) => Effect.Effect<Uint8Array, HttpBodyError, S["EncodingServices"]>;
export declare const jsonUnsafe: (body: unknown, contentType?: string): Uint8Array;
export declare const raw: (body: unknown, options?: { readonly contentType?: string | undefined; readonly contentLength?: number | undefined; } | undefined): Raw;
export declare const stream: (body: Stream_.Stream<globalThis.Uint8Array, unknown>, contentType?: string, contentLength?: number): Stream;
export declare const text: (body: string, contentType?: string): Uint8Array;
export declare const uint8Array: (body: globalThis.Uint8Array, contentType?: string): Uint8Array;
export declare const urlParams: (urlParams: UrlParams.UrlParams, contentType?: string): Uint8Array;
```

## Other Exports (Non-Function)

- `empty` (variable)
- `Empty` (class)
- `ErrorReason` (type)
- `FormData` (class)
- `FormDataCoercible` (type)
- `FormDataInput` (type)
- `HttpBody` (type)
- `HttpBodyError` (class)
- `Raw` (class)
- `Stream` (class)
- `Uint8Array` (class)
