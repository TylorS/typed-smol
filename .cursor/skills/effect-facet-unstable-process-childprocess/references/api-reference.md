# API Reference: effect/unstable/process/ChildProcess

- Import path: `effect/unstable/process/ChildProcess`
- Source file: `packages/effect/src/unstable/process/ChildProcess.ts`
- Function exports (callable): 16
- Non-function exports: 18

## Purpose

An Effect-native module for working with child processes.

## Key Function Exports

- `exitCode`
- `fdName`
- `isCommand`
- `isPipedCommand`
- `isStandardCommand`
- `lines`
- `make`
- `parseFdName`
- `pipeTo`
- `prefix`
- `setCwd`
- `setEnv`
- `spawn`
- `streamLines`
- `streamString`
- `string`

## All Function Signatures

```ts
export declare const exitCode: (command: Command): Effect.Effect<ExitCode, PlatformError.PlatformError, ChildProcessSpawner>;
export declare const fdName: (fd: number): string;
export declare const isCommand: (u: unknown): u is Command;
export declare const isPipedCommand: (command: Command): command is PipedCommand;
export declare const isStandardCommand: (command: Command): command is StandardCommand;
export declare const lines: (options?: { readonly includeStderr?: boolean | undefined; }): (self: Command) => Effect.Effect<Array<string>, PlatformError.PlatformError, ChildProcessSpawner>; // overload 1
export declare const lines: (self: Command, options?: { readonly includeStderr?: boolean | undefined; }): Effect.Effect<Array<string>, PlatformError.PlatformError, ChildProcessSpawner>; // overload 2
export declare const make: (command: string, options?: CommandOptions): StandardCommand; // overload 1
export declare const make: (command: string, args: ReadonlyArray<string>, options?: CommandOptions): StandardCommand; // overload 2
export declare const make: (options: CommandOptions): (templates: TemplateStringsArray, ...expressions: ReadonlyArray<TemplateExpression>) => StandardCommand; // overload 3
export declare const make: (templates: TemplateStringsArray, ...expressions: ReadonlyArray<TemplateExpression>): StandardCommand; // overload 4
export declare const parseFdName: (name: string): number | undefined;
export declare const pipeTo: (that: Command, options?: PipeOptions): (self: Command) => PipedCommand; // overload 1
export declare const pipeTo: (self: Command, that: Command, options?: PipeOptions): PipedCommand; // overload 2
export declare const prefix: (command: string, args?: ReadonlyArray<string>): (self: Command) => Command; // overload 1
export declare const prefix: (templates: TemplateStringsArray, ...expressions: ReadonlyArray<TemplateExpression>): (self: Command) => Command; // overload 2
export declare const prefix: (self: Command, command: string, args?: ReadonlyArray<string>): Command; // overload 3
export declare const setCwd: (cwd: string): (self: Command) => Command; // overload 1
export declare const setCwd: (self: Command, cwd: string): Command; // overload 2
export declare const setEnv: (env: Record<string, string>): (self: Command) => Command; // overload 1
export declare const setEnv: (self: Command, env: Record<string, string>): Command; // overload 2
export declare const spawn: (command: Command): Effect.Effect<ChildProcessHandle, PlatformError.PlatformError, ChildProcessSpawner | Scope.Scope>;
export declare const streamLines: (options?: { readonly includeStderr?: boolean | undefined; }): (self: Command) => Stream.Stream<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 1
export declare const streamLines: (self: Command, options?: { readonly includeStderr?: boolean | undefined; }): Stream.Stream<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 2
export declare const streamString: (options?: { readonly includeStderr?: boolean | undefined; }): (self: Command) => Stream.Stream<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 1
export declare const streamString: (self: Command, options?: { readonly includeStderr?: boolean | undefined; }): Stream.Stream<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 2
export declare const string: (options?: { readonly includeStderr?: boolean | undefined; }): (self: Command) => Effect.Effect<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 1
export declare const string: (self: Command, options?: { readonly includeStderr?: boolean | undefined; }): Effect.Effect<string, PlatformError.PlatformError, ChildProcessSpawner>; // overload 2
```

## Other Exports (Non-Function)

- `AdditionalFdConfig` (type)
- `Command` (type)
- `CommandInput` (type)
- `CommandOptions` (interface)
- `CommandOutput` (type)
- `Encoding` (type)
- `KillOptions` (interface)
- `PipedCommand` (interface)
- `PipeFromOption` (type)
- `PipeOptions` (interface)
- `PipeToOption` (type)
- `Signal` (type)
- `StandardCommand` (interface)
- `StderrConfig` (interface)
- `StdinConfig` (interface)
- `StdoutConfig` (interface)
- `TemplateExpression` (type)
- `TemplateExpressionItem` (type)
