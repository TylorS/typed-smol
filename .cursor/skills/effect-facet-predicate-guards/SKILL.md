---
name: effect-facet-predicate-guards
description: Guidance for facet `effect/Predicate#guards` focused on APIs like isMap, isSet, and isDate. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Predicate#guards

## Owned scope

- Owns only `effect/Predicate#guards`.
- Parent module: `effect/Predicate`.

## What it is for

- runtime type guard helpers. Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## API quick reference

- `isMap`
- `isSet`
- `isDate`
- `isNull`
- `isError`
- `isNever`
- `isBigInt`
- `isNumber`
- `isObject`
- `isRegExp`
- `isString`
- `isSymbol`
- `isTagged`
- `isTruthy`
- `isBoolean`
- `isNotNull`
- `isNullish`
- `isPromise`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `guards` concern for `effect/Predicate`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import * as Predicate from "effect/Predicate";

const isPositive = (n: number) => n > 0;
const data = [2, -1, 3];

console.log(data.filter(isPositive));
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-predicate-combinators` (effect/Predicate#combinators)
  - `effect-facet-predicate-core` (effect/Predicate#core)
- Parent module ownership belongs to `effect-module-predicate`.

## Escalate to

- `effect-module-predicate` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Predicate.test.ts`
- Parent tests: `packages/effect/test/Iterable.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
