# API Reference: effect/Encoding

- Import path: `effect/Encoding`
- Source file: `packages/effect/src/Encoding.ts`
- Function exports (callable): 10
- Non-function exports: 2

## Purpose

Encoding & decoding for Base64 (RFC4648), Base64Url, and Hex.

## Key Function Exports

- `decodeBase64`
- `decodeBase64String`
- `decodeBase64Url`
- `decodeBase64UrlString`
- `decodeHex`
- `decodeHexString`
- `encodeBase64`
- `encodeBase64Url`
- `encodeHex`
- `isEncodingError`

## All Function Signatures

```ts
export declare const decodeBase64: (str: string): Result.Result<Uint8Array, EncodingError>;
export declare const decodeBase64String: (str: string): Result.Result<string, EncodingError>;
export declare const decodeBase64Url: (str: string): Result.Result<Uint8Array, EncodingError>;
export declare const decodeBase64UrlString: (str: string): Result.Result<string, EncodingError>;
export declare const decodeHex: (str: string): Result.Result<Uint8Array, EncodingError>;
export declare const decodeHexString: (str: string): Result.Result<string, EncodingError>;
export declare const encodeBase64: (input: Uint8Array | string): string;
export declare const encodeBase64Url: (input: Uint8Array | string): string;
export declare const encodeHex: (input: Uint8Array | string): string;
export declare const isEncodingError: (u: unknown): u is EncodingError;
```

## Other Exports (Non-Function)

- `EncodingError` (class)
- `EncodingErrorTypeId` (type)
