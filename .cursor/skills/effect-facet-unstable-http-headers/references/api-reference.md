# API Reference: effect/unstable/http/Headers

- Import path: `effect/unstable/http/Headers`
- Source file: `packages/effect/src/unstable/http/Headers.ts`
- Function exports (callable): 11
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `Equivalence`
- `fromInput`
- `fromRecordUnsafe`
- `get`
- `has`
- `isHeaders`
- `merge`
- `redact`
- `remove`
- `set`
- `setAll`

## All Function Signatures

```ts
export declare const Equivalence: (self: Headers, that: Headers): boolean;
export declare const fromInput: (input?: Input): Headers;
export declare const fromRecordUnsafe: (input: Record.ReadonlyRecord<string, string>): Headers;
export declare const get: (key: string): (self: Headers) => string | undefined; // overload 1
export declare const get: (self: Headers, key: string): string | undefined; // overload 2
export declare const has: (key: string): (self: Headers) => boolean; // overload 1
export declare const has: (self: Headers, key: string): boolean; // overload 2
export declare const isHeaders: (u: unknown): u is Headers;
export declare const merge: (headers: Headers): (self: Headers) => Headers; // overload 1
export declare const merge: (self: Headers, headers: Headers): Headers; // overload 2
export declare const redact: (key: string | RegExp | ReadonlyArray<string | RegExp>): (self: Headers) => Record<string, string | Redacted.Redacted>; // overload 1
export declare const redact: (self: Headers, key: string | RegExp | ReadonlyArray<string | RegExp>): Record<string, string | Redacted.Redacted>; // overload 2
export declare const remove: (key: string): (self: Headers) => Headers; // overload 1
export declare const remove: (self: Headers, key: string): Headers; // overload 2
export declare const set: (key: string, value: string): (self: Headers) => Headers; // overload 1
export declare const set: (self: Headers, key: string, value: string): Headers; // overload 2
export declare const setAll: (headers: Input): (self: Headers) => Headers; // overload 1
export declare const setAll: (self: Headers, headers: Input): Headers; // overload 2
```

## Other Exports (Non-Function)

- `CurrentRedactedNames` (variable)
- `empty` (variable)
- `Headers` (interface)
- `HeadersSchema` (interface)
- `Input` (type)
- `TypeId` (type)
