# API Reference: effect/SchemaIssue

- Import path: `effect/SchemaIssue`
- Source file: `packages/effect/src/SchemaIssue.ts`
- Function exports (callable): 9
- Non-function exports: 16

## Purpose

Structured validation errors produced by the Effect Schema system.

## Key Function Exports

- `defaultCheckHook`
- `defaultFormatter`
- `defaultLeafHook`
- `getActual`
- `isIssue`
- `make`
- `makeFormatterDefault`
- `makeFormatterStandardSchemaV1`
- `redact`

## All Function Signatures

```ts
export declare const defaultCheckHook: (issue: Filter): string | undefined;
export declare const defaultFormatter: (value: Issue): string;
export declare const defaultLeafHook: (issue: Leaf): string;
export declare const getActual: (issue: Issue): Option.Option<unknown>;
export declare const isIssue: (u: unknown): u is Issue;
export declare const make: (input: unknown, out: undefined | boolean | string | Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }): Issue | undefined;
export declare const makeFormatterDefault: (): Formatter<string>;
export declare const makeFormatterStandardSchemaV1: (options?: { readonly leafHook?: LeafHook | undefined; readonly checkHook?: CheckHook | undefined; }): Formatter<StandardSchemaV1.FailureResult>;
export declare const redact: (issue: Issue): Issue;
```

## Other Exports (Non-Function)

- `AnyOf` (class)
- `CheckHook` (type)
- `Composite` (class)
- `Encoding` (class)
- `Filter` (class)
- `Forbidden` (class)
- `Formatter` (interface)
- `InvalidType` (class)
- `InvalidValue` (class)
- `Issue` (type)
- `Leaf` (type)
- `LeafHook` (type)
- `MissingKey` (class)
- `OneOf` (class)
- `Pointer` (class)
- `UnexpectedKey` (class)
