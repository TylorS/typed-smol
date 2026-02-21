---
name: effect-facet-unstable-devtools-devtoolsschema
description: Guidance for facet `effect/unstable/devtools/DevToolsSchema` focused on APIs like Ping, Pong, and Span. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/devtools/DevToolsSchema

## Owned scope

- Owns only `effect/unstable/devtools/DevToolsSchema`.
- Parent module: `effect/unstable/devtools`.
- Source anchor: `packages/effect/src/unstable/devtools/DevToolsSchema.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Ping`
- `Pong`
- `Span`
- `Gauge`
- `Metric`
- `Counter`
- `Request`
- `Summary`
- `Response`
- `Frequency`
- `Histogram`
- `SpanEvent`
- `ParentSpan`
- `SpanStatus`
- `MetricLabel`
- `WithoutPing`
- `WithoutPong`
- `ExternalSpan`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { DevToolsSchema } from "effect/unstable/devtools/DevToolsSchema";

const value = DevToolsSchema.Ping();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-devtools-devtools` (effect/unstable/devtools/DevTools)
  - `effect-facet-unstable-devtools-devtoolsclient` (effect/unstable/devtools/DevToolsClient)
  - `effect-facet-unstable-devtools-devtoolsserver` (effect/unstable/devtools/DevToolsServer)
- Parent module ownership belongs to `effect-module-unstable-devtools`.

## Escalate to

- `effect-module-unstable-devtools` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/devtools/DevToolsSchema.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
