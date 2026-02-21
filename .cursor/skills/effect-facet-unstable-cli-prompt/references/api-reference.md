# API Reference: effect/unstable/cli/Prompt

- Import path: `effect/unstable/cli/Prompt`
- Source file: `packages/effect/src/unstable/cli/Prompt.ts`
- Function exports (callable): 20
- Non-function exports: 21

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `all`
- `autoComplete`
- `confirm`
- `custom`
- `date`
- `file`
- `flatMap`
- `float`
- `hidden`
- `integer`
- `isPrompt`
- `list`
- `map`
- `multiSelect`
- `password`
- `run`
- `select`
- `succeed`

## All Function Signatures

```ts
export declare const all: <const Arg extends Iterable<Prompt<any>> | Record<string, Prompt<any>>>(arg: Arg): All.Return<Arg>;
export declare const autoComplete: <const A>(options: AutoCompleteOptions<A>): Prompt<A>;
export declare const confirm: (options: ConfirmOptions): Prompt<boolean>;
export declare const custom: <State, Output>(initialState: State | Effect.Effect<State, never, Environment>, handlers: Handlers<State, Output>): Prompt<Output>;
export declare const date: (options: DateOptions): Prompt<Date>;
export declare const file: (options?: FileOptions): Prompt<string>;
export declare const flatMap: <Output, Output2>(f: (output: Output) => Prompt<Output2>): (self: Prompt<Output>) => Prompt<Output2>; // overload 1
export declare const flatMap: <Output, Output2>(self: Prompt<Output>, f: (output: Output) => Prompt<Output2>): Prompt<Output2>; // overload 2
export declare const float: (options: FloatOptions): Prompt<number>;
export declare const hidden: (options: TextOptions): Prompt<Redacted.Redacted>;
export declare const integer: (options: IntegerOptions): Prompt<number>;
export declare const isPrompt: (u: unknown): u is Prompt<unknown>;
export declare const list: (options: ListOptions): Prompt<Array<string>>;
export declare const map: <Output, Output2>(f: (output: Output) => Output2): (self: Prompt<Output>) => Prompt<Output2>; // overload 1
export declare const map: <Output, Output2>(self: Prompt<Output>, f: (output: Output) => Output2): Prompt<Output2>; // overload 2
export declare const multiSelect: <const A>(options: SelectOptions<A> & MultiSelectOptions): Prompt<Array<A>>;
export declare const password: (options: TextOptions): Prompt<Redacted.Redacted>;
export declare const run: <Output>(self: Prompt<Output>): Effect.Effect<Output, Terminal.QuitError, Environment>;
export declare const select: <const A>(options: SelectOptions<A>): Prompt<A>;
export declare const succeed: <A>(value: A): Prompt<A>;
export declare const text: (options: TextOptions): Prompt<string>;
export declare const toggle: (options: ToggleOptions): Prompt<boolean>;
```

## Other Exports (Non-Function)

- `Action` (type)
- `ActionDefinition` (interface)
- `All` (namespace)
- `Any` (type)
- `AutoCompleteOptions` (interface)
- `ConfirmOptions` (interface)
- `DateOptions` (interface)
- `Environment` (type)
- `FileOptions` (interface)
- `FloatOptions` (interface)
- `Handlers` (interface)
- `IntegerOptions` (interface)
- `ListOptions` (interface)
- `MultiSelectOptions` (interface)
- `OnSuccess` (interface)
- `platformFigures` (variable)
- `Prompt` (interface)
- `SelectChoice` (interface)
- `SelectOptions` (interface)
- `TextOptions` (interface)
- `ToggleOptions` (interface)
