---
name: effect-module-tracer
description: Guidance for `effect/Tracer` focused on APIs like make, Span, and Tracer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Tracer

## Owned scope

- Owns only `effect/Tracer`.
- Source of truth: `packages/effect/src/Tracer.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `Span`
- `Tracer`
- `AnySpan`
- `SpanKind`
- `SpanLink`
- `TracerKey`
- `NativeSpan`
- `ParentSpan`
- `SpanStatus`
- `SpanOptions`
- `externalSpan`
- `ExternalSpan`
- `TraceOptions`
- `ParentSpanKey`
- `CurrentTraceLevel`
- `DisablePropagation`
- `EffectPrimitive`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Tracer } from "effect";
import { Exit } from "effect";

// Started span status
const startedStatus: Tracer.SpanStatus = {
  _tag: "Started",
  startTime: BigInt(Date.now() * 1000000),
};

// Ended span status
const endedStatus: Tracer.SpanStatus = {
  _tag: "Ended",
  startTime: BigInt(Date.now() * 1000000),
  endTime: BigInt(Date.now() * 1000000 + 1000000),
  exit: Exit.succeed("result"),
};
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Tracer.ts`
- Representative tests: `packages/effect/test/Tracer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
