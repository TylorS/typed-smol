# API Reference: effect/PlatformError

- Import path: `effect/PlatformError`
- Source file: `packages/effect/src/PlatformError.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `badArgument`
- `systemError`

## All Function Signatures

```ts
export declare const badArgument: (options: { readonly module: string; readonly method: string; readonly description?: string | undefined; readonly cause?: unknown; }): PlatformError;
export declare const systemError: (options: { readonly _tag: SystemErrorTag; readonly module: string; readonly method: string; readonly description?: string | undefined; readonly syscall?: string | undefined; readonly pathOrDescriptor?: string | number | undefined; readonly cause?: unknown; }): PlatformError;
```

## Other Exports (Non-Function)

- `BadArgument` (class)
- `PlatformError` (class)
- `SystemError` (class)
- `SystemErrorTag` (type)
