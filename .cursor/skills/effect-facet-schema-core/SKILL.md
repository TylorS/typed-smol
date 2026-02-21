---
name: effect-facet-schema-core
description: Guidance for facet `effect/Schema#core` focused on APIs like make, MakeIn, and fromBrand. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Schema#core

## Owned scope

- Owns only `effect/Schema#core`.
- Parent module: `effect/Schema`.

## What it is for

- schema model and constructors. Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `MakeIn`
- `fromBrand`
- `makeFilter`
- `MakeOptions`
- `fromFormData`
- `makeIsBetween`
- `fromJsonString`
- `fromURLSearchParams`
- `makeFilterGroup`
- `makeIsGreaterThan`
- `makeIsGreaterThanOrEqualTo`
- `makeIsLessThan`
- `makeIsLessThanOrEqualTo`
- `makeIsMultipleOf`
- `HashSet`
- `HashSetIso`
- `ReadonlySet`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `core` concern for `effect/Schema`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

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

- Sibling facets under the same parent are out of scope:
  - `effect-facet-schema-checks` (effect/Schema#checks)
  - `effect-facet-schema-composition` (effect/Schema#composition)
  - `effect-facet-schema-decoding` (effect/Schema#decoding)
  - `effect-facet-schema-encoding` (effect/Schema#encoding)
- Parent module ownership belongs to `effect-module-schema`.

## Escalate to

- `effect-module-schema` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/schema/Schema.test.ts`
- Parent tests: `packages/effect/test/JsonPatch.test.ts`
- Parent tests: `packages/effect/test/unstable/encoding/Sse.test.ts`
- Parent tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
