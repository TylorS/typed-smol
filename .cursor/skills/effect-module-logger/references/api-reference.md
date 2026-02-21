# API Reference: effect/Logger

- Import path: `effect/Logger`
- Source file: `packages/effect/src/Logger.ts`
- Function exports (callable): 10
- Non-function exports: 12

## Purpose

The `Logger` module provides a robust and flexible logging system for Effect applications. It offers structured logging, multiple output formats, and seamless integration with the Effect runtime's tracing and context management.

## Key Function Exports

- `batched`
- `consolePretty`
- `isLogger`
- `layer`
- `make`
- `map`
- `toFile`
- `withConsoleError`
- `withConsoleLog`
- `withLeveledConsole`

## All Function Signatures

```ts
export declare const batched: <Output>(options: { readonly window: Duration.Input; readonly flush: (messages: Array<NoInfer<Output>>) => Effect.Effect<void>; }): <Message>(self: Logger<Message, Output>) => Effect.Effect<Logger<Message, void>, never, Scope.Scope>; // overload 1
export declare const batched: <Message, Output>(self: Logger<Message, Output>, options: { readonly window: Duration.Input; readonly flush: (messages: Array<NoInfer<Output>>) => Effect.Effect<void>; }): Effect.Effect<Logger<Message, void>, never, Scope.Scope>; // overload 2
export declare const consolePretty: (options?: { readonly colors?: "auto" | boolean | undefined; readonly stderr?: boolean | undefined; readonly formatDate?: ((date: Date) => string) | undefined; readonly mode?: "browser" | "tty" | "auto" | undefined; }): Logger<unknown, void>;
export declare const isLogger: (u: unknown): u is Logger<unknown, unknown>;
export declare const layer: <const Loggers extends ReadonlyArray<Logger<unknown, unknown> | Effect.Effect<Logger<unknown, unknown>, any, any>>>(loggers: Loggers, options?: { mergeWithExisting: boolean; }): Layer.Layer<never, Loggers extends readonly [] ? never : Effect.Error<Loggers[number]>, Exclude<Loggers extends readonly [] ? never : Effect.Services<Loggers[number]>, Scope.Scope>>;
export declare const make: <Message, Output>(log: (options: Logger.Options<Message>) => Output): Logger<Message, Output>;
export declare const map: <Output, Output2>(f: (output: Output) => Output2): <Message>(self: Logger<Message, Output>) => Logger<Message, Output2>; // overload 1
export declare const map: <Message, Output, Output2>(self: Logger<Message, Output>, f: (output: Output) => Output2): Logger<Message, Output2>; // overload 2
export declare const toFile: (path: string, options?: { readonly flag?: FileSystem.OpenFlag | undefined; readonly mode?: number | undefined; readonly batchWindow?: Duration.Input | undefined; } | undefined): <Message>(self: Logger<Message, string>) => Effect.Effect<Logger<Message, void>, PlatformError, Scope.Scope | FileSystem.FileSystem>; // overload 1
export declare const toFile: <Message>(self: Logger<Message, string>, path: string, options?: { readonly flag?: FileSystem.OpenFlag | undefined; readonly mode?: number | undefined; readonly batchWindow?: Duration.Input | undefined; } | undefined): Effect.Effect<Logger<Message, void>, PlatformError, Scope.Scope | FileSystem.FileSystem>; // overload 2
export declare const withConsoleError: <Message, Output>(self: Logger<Message, Output>): Logger<Message, void>;
export declare const withConsoleLog: <Message, Output>(self: Logger<Message, Output>): Logger<Message, void>;
export declare const withLeveledConsole: <Message, Output>(self: Logger<Message, Output>): Logger<Message, void>;
```

## Other Exports (Non-Function)

- `consoleJson` (variable)
- `consoleLogFmt` (variable)
- `consoleStructured` (variable)
- `CurrentLoggers` (variable)
- `defaultLogger` (variable)
- `formatJson` (variable)
- `formatLogFmt` (variable)
- `formatSimple` (variable)
- `formatStructured` (variable)
- `Logger` (interface)
- `LogToStderr` (variable)
- `tracerLogger` (variable)
