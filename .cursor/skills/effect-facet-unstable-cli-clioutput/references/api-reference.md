# API Reference: effect/unstable/cli/CliOutput

- Import path: `effect/unstable/cli/CliOutput`
- Source file: `packages/effect/src/unstable/cli/CliOutput.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `defaultFormatter`
- `layer`

## All Function Signatures

```ts
export declare const defaultFormatter: (options?: { colors?: boolean; }): Formatter;
export declare const layer: (formatter: Formatter): Layer.Layer<never>;
```

## Other Exports (Non-Function)

- `Formatter` (interface)
