# API Reference: effect/Fiber#status

- Import path: `effect/Fiber#status`
- Source file: `packages/effect/src/Fiber.ts`
- Thematic facet: `status`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## Key Function Exports

- `isFiber`

## All Function Signatures

```ts
export declare const isFiber: (u: unknown): u is Fiber<unknown, unknown>;
```

## Other Exports (Non-Function)

- `Fiber` (interface)
