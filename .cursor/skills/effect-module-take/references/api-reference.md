# API Reference: effect/Take

- Import path: `effect/Take`
- Source file: `packages/effect/src/Take.ts`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `toPull`

## All Function Signatures

```ts
export declare const toPull: <A, E, Done>(take: Take<A, E, Done>): Pull.Pull<NonEmptyReadonlyArray<A>, E, Done>;
```

## Other Exports (Non-Function)

- `Take` (type)
