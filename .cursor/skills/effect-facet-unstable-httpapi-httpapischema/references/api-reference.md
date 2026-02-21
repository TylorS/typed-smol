# API Reference: effect/unstable/httpapi/HttpApiSchema

- Import path: `effect/unstable/httpapi/HttpApiSchema`
- Source file: `packages/effect/src/unstable/httpapi/HttpApiSchema.ts`
- Function exports (callable): 13
- Non-function exports: 8

## Purpose

HttpApiSchema provides helpers to annotate Effect Schema values with HTTP API metadata (status codes and payload/response encodings) used by the HttpApi builder, client, and OpenAPI generation.

## Key Function Exports

- `asFormUrlEncoded`
- `asJson`
- `asMultipart`
- `asMultipartStream`
- `asNoContent`
- `asText`
- `asUint8Array`
- `Empty`
- `getPayloadEncoding`
- `getResponseEncoding`
- `getStatusError`
- `getStatusSuccess`
- `status`

## All Function Signatures

```ts
export declare const asFormUrlEncoded: (options?: { readonly contentType?: string; }): <S extends Schema.Top & { readonly Encoded: Record<string, string | ReadonlyArray<string> | undefined>; }>(self: S) => S["~rebuild.out"];
export declare const asJson: (options?: { readonly contentType?: string; }): <S extends Schema.Top>(self: S) => S["~rebuild.out"];
export declare const asMultipart: (options?: Multipart_.withLimits.Options): <S extends Schema.Top>(self: S) => asMultipart<S>;
export declare const asMultipartStream: (options?: Multipart_.withLimits.Options): <S extends Schema.Top>(self: S) => asMultipartStream<S>;
export declare const asNoContent: <S extends Schema.Top>(options: { readonly decode: LazyArg<S["Type"]>; }): (self: S) => asNoContent<S>;
export declare const asText: (options?: { readonly contentType?: string; }): <S extends Schema.Top & { readonly Encoded: string; }>(self: S) => S["~rebuild.out"];
export declare const asUint8Array: (options?: { readonly contentType?: string; }): <S extends Schema.Top & { readonly Encoded: Uint8Array; }>(self: S) => S["~rebuild.out"];
export declare const Empty: (code: number): Schema.Void;
export declare const getPayloadEncoding: (ast: AST.AST): PayloadEncoding;
export declare const getResponseEncoding: (ast: AST.AST): ResponseEncoding;
export declare const getStatusError: (self: AST.AST): number;
export declare const getStatusSuccess: (self: AST.AST): number;
export declare const status: (code: number): <S extends Schema.Top>(self: S) => S["~rebuild.out"];
```

## Other Exports (Non-Function)

- `Accepted` (interface)
- `Created` (interface)
- `Encoding` (type)
- `MultipartStreamTypeId` (type)
- `MultipartTypeId` (type)
- `NoContent` (interface)
- `PayloadEncoding` (type)
- `ResponseEncoding` (type)
