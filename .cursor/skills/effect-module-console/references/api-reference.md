# API Reference: effect/Console

- Import path: `effect/Console`
- Source file: `packages/effect/src/Console.ts`
- Function exports (callable): 18
- Non-function exports: 2

## Purpose

The `Console` module provides a functional interface for console operations within the Effect ecosystem. It offers type-safe logging, debugging, and console manipulation capabilities with built-in support for testing and environment isolation.

## Key Function Exports

- `assert`
- `consoleWith`
- `count`
- `countReset`
- `debug`
- `dir`
- `dirxml`
- `error`
- `group`
- `info`
- `log`
- `table`
- `time`
- `timeLog`
- `trace`
- `warn`
- `withGroup`
- `withTime`

## All Function Signatures

```ts
export declare const assert: (condition: boolean, ...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const consoleWith: <A, E, R>(f: (console: Console) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
export declare const count: (label?: string): Effect.Effect<void>;
export declare const countReset: (label?: string): Effect.Effect<void>;
export declare const debug: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const dir: (item: any, options?: any): Effect.Effect<void>;
export declare const dirxml: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const error: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const group: (options?: { label?: string | undefined; collapsed?: boolean | undefined; } | undefined): Effect.Effect<void, never, Scope>;
export declare const info: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const log: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const table: (tabularData: any, properties?: ReadonlyArray<string>): Effect.Effect<void>;
export declare const time: (label?: string | undefined): Effect.Effect<void, never, Scope>;
export declare const timeLog: (label?: string, ...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const trace: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const warn: (...args: ReadonlyArray<any>): Effect.Effect<void>;
export declare const withGroup: (options?: { readonly label?: string | undefined; readonly collapsed?: boolean | undefined; }): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const withGroup: <A, E, R>(self: Effect.Effect<A, E, R>, options?: { readonly label?: string | undefined; readonly collapsed?: boolean | undefined; }): Effect.Effect<A, E, R>; // overload 2
export declare const withTime: (label?: string): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>; // overload 1
export declare const withTime: <A, E, R>(self: Effect.Effect<A, E, R>, label?: string): Effect.Effect<A, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `clear` (variable)
- `Console` (interface)
