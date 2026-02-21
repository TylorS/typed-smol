---
name: effect-module-schema
description: Guidance for `effect/Schema` focused on APIs like make, decode, and encode. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Schema

## Owned scope

- Owns only `effect/Schema`.
- Source of truth: `packages/effect/src/Schema.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `decode`
- `encode`
- `Filter`
- `MakeIn`
- `Decoder`
- `Encoded`
- `Encoder`
- `decodeTo`
- `encodeTo`
- `fromBrand`
- `decodeExit`
- `decodeSync`
- `encodeExit`
- `encodeKeys`
- `encodeSync`
- `makeFilter`
- `MakeOptions`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Schema } from "effect"

// Define custom hook functions for error formatting
const leafHook = (issue: any) => {
  switch (issue._tag) {
    case "InvalidType":
      return "Expected different type"
    case "InvalidValue":
      return "Invalid value provided"
    case "MissingKey":
      return "Required property missing"
    case "UnexpectedKey":
      return "Unexpected property found"
    case "Forbidden":
      return "Operation not allowed"
    case "OneOf":
      return "Multiple valid options available"
    default:
      return "Validation error"
  }
}

// Create a standard schema from a regular schema
const PersonSchema = Schema.Struct({
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-schema-checks` (effect/Schema#checks)
  - `effect-facet-schema-composition` (effect/Schema#composition)
  - `effect-facet-schema-core` (effect/Schema#core)
  - `effect-facet-schema-decoding` (effect/Schema#decoding)
  - `effect-facet-schema-encoding` (effect/Schema#encoding)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-schema-checks`.

## Reference anchors

- Module source: `packages/effect/src/Schema.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- Representative tests: `packages/effect/test/JsonPatch.test.ts`
- Representative tests: `packages/effect/test/unstable/encoding/Sse.test.ts`
- Representative tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- Representative tests: `packages/effect/test/Brand.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
