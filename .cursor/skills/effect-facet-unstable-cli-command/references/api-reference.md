# API Reference: effect/unstable/cli/Command

- Import path: `effect/unstable/cli/Command`
- Source file: `packages/effect/src/unstable/cli/Command.ts`
- Function exports (callable): 11
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isCommand`
- `make`
- `provide`
- `provideEffect`
- `provideEffectDiscard`
- `provideSync`
- `run`
- `runWith`
- `withDescription`
- `withHandler`
- `withSubcommands`

## All Function Signatures

```ts
export declare const isCommand: (u: unknown): u is Command.Any;
export declare const make: <Name extends string>(name: Name): Command<Name, {}, never, never>; // overload 1
export declare const make: <Name extends string, const Config extends Command.Config>(name: Name, config: Config): Command<Name, Command.Config.Infer<Config>, never, never>; // overload 2
export declare const make: <Name extends string, const Config extends Command.Config, R, E>(name: Name, config: Config, handler: (config: Command.Config.Infer<Config>) => Effect.Effect<void, E, R>): Command<Name, Command.Config.Infer<Config>, E, R>; // overload 3
export declare const provide: <Input, LR, LE, LA>(layer: Layer.Layer<LA, LE, LR> | ((input: Input) => Layer.Layer<LA, LE, LR>), options?: { readonly local?: boolean | undefined; } | undefined): <const Name extends string, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E | LE, Exclude<R, LA> | LR>; // overload 1
export declare const provide: <const Name extends string, Input, E, R, LA, LE, LR>(self: Command<Name, Input, E, R>, layer: Layer.Layer<LA, LE, LR> | ((input: Input) => Layer.Layer<LA, LE, LR>), options?: { readonly local?: boolean | undefined; } | undefined): Command<Name, Input, E | LE, Exclude<R, LA> | LR>; // overload 2
export declare const provideEffect: <I, S, Input, R2, E2>(service: ServiceMap.Service<I, S>, effect: Effect.Effect<S, E2, R2> | ((input: Input) => Effect.Effect<S, E2, R2>)): <const Name extends string, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E | E2, Exclude<R, I> | R2>; // overload 1
export declare const provideEffect: <const Name extends string, Input, E, R, I, S, R2, E2>(self: Command<Name, Input, E, R>, service: ServiceMap.Service<I, S>, effect: Effect.Effect<S, E2, R2> | ((input: Input) => Effect.Effect<S, E2, R2>)): Command<Name, Input, E | E2, Exclude<R, I> | R2>; // overload 2
export declare const provideEffectDiscard: <_, Input, E2, R2>(effect: Effect.Effect<_, E2, R2> | ((input: Input) => Effect.Effect<_, E2, R2>)): <const Name extends string, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E | E2, R | R2>; // overload 1
export declare const provideEffectDiscard: <const Name extends string, Input, E, R, _, E2, R2>(self: Command<Name, Input, E, R>, effect: Effect.Effect<_, E2, R2> | ((input: Input) => Effect.Effect<_, E2, R2>)): Command<Name, Input, E | E2, R | R2>; // overload 2
export declare const provideSync: <I, S, Input>(service: ServiceMap.Service<I, S>, implementation: S | ((input: Input) => S)): <const Name extends string, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E, Exclude<R, I>>; // overload 1
export declare const provideSync: <const Name extends string, Input, E, R, I, S>(self: Command<Name, Input, E, R>, service: ServiceMap.Service<I, S>, implementation: S | ((input: Input) => S)): Command<Name, Input, E, Exclude<R, I>>; // overload 2
export declare const run: <Name extends string, Input, E, R>(command: Command<Name, Input, E, R>, config: { readonly version: string; }): Effect.Effect<void, E | CliError.CliError, R | Environment>; // overload 1
export declare const run: (config: { readonly version: string; }): <Name extends string, Input, E, R>(command: Command<Name, Input, E, R>) => Effect.Effect<void, E | CliError.CliError, R | Environment>; // overload 2
export declare const runWith: <const Name extends string, Input, E, R>(command: Command<Name, Input, E, R>, config: { readonly version: string; }): (input: ReadonlyArray<string>) => Effect.Effect<void, Exclude<E, Terminal.QuitError> | CliError.CliError, R | Environment>;
export declare const withDescription: (description: string): <const Name extends string, Input, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E, R>; // overload 1
export declare const withDescription: <const Name extends string, Input, E, R>(self: Command<Name, Input, E, R>, description: string): Command<Name, Input, E, R>; // overload 2
export declare const withHandler: <A, R, E>(handler: (value: A) => Effect.Effect<void, E, R>): <Name extends string, XR, XE>(self: Command<Name, A, XE, XR>) => Command<Name, A, E, R>; // overload 1
export declare const withHandler: <Name extends string, A, XR, XE, R, E>(self: Command<Name, A, XE, XR>, handler: (value: A) => Effect.Effect<void, E, R>): Command<Name, A, E, R>; // overload 2
export declare const withSubcommands: <const Subcommands extends ReadonlyArray<Command<any, any, any, any>>>(subcommands: Subcommands): <Name extends string, Input, E, R>(self: Command<Name, Input, E, R>) => Command<Name, Input, E | ExtractSubcommandErrors<Subcommands>, R | Exclude<ExtractSubcommandContext<Subcommands>, CommandContext<Name>>>; // overload 1
export declare const withSubcommands: <Name extends string, Input, E, R, const Subcommands extends ReadonlyArray<Command<any, any, any, any>>>(self: Command<Name, Input, E, R>, subcommands: Subcommands): Command<Name, Input, E | ExtractSubcommandErrors<Subcommands>, R | Exclude<ExtractSubcommandContext<Subcommands>, CommandContext<Name>>>; // overload 2
```

## Other Exports (Non-Function)

- `Command` (interface)
- `CommandContext` (interface)
- `Environment` (type)
- `Error` (type)
- `ParsedTokens` (interface)
