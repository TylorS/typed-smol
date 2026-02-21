# API Reference: effect/unstable/process/ChildProcessSpawner

- Import path: `effect/unstable/process/ChildProcessSpawner`
- Source file: `packages/effect/src/unstable/process/ChildProcessSpawner.ts`
- Function exports (callable): 3
- Non-function exports: 2

## Purpose

A module providing a generic service interface for spawning child processes.

## Key Function Exports

- `ExitCode`
- `makeHandle`
- `ProcessId`

## All Function Signatures

```ts
export declare const ExitCode: (unbranded: number): ExitCode;
export declare const makeHandle: (params: Omit<ChildProcessHandle, typeof HandleTypeId>): ChildProcessHandle;
export declare const ProcessId: (unbranded: number): ProcessId;
```

## Other Exports (Non-Function)

- `ChildProcessHandle` (interface)
- `ChildProcessSpawner` (interface)
