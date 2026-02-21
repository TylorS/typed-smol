# API Reference: effect/unstable/http/Multipasta

- Import path: `effect/unstable/http/Multipasta`
- Source file: `packages/effect/src/unstable/http/Multipasta.ts`
- Function exports (callable): 3
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decodeField`
- `defaultIsFile`
- `make`

## All Function Signatures

```ts
export declare const decodeField: (info: PartInfo, value: Uint8Array): string;
export declare const defaultIsFile: (info: PartInfo): boolean;
export declare const make: (options: Config): Parser;
```

## Other Exports (Non-Function)

- `BaseConfig` (type)
- `Config` (type)
- `MultipartError` (type)
- `Parser` (interface)
- `PartInfo` (interface)
