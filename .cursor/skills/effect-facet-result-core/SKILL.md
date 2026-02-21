---
name: effect-facet-result-core
description: Guidance for facet `effect/Result#core` focused on APIs like getOrElse, getOrNull, and fromOption. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Result#core

## Owned scope

- Owns only `effect/Result#core`.
- Parent module: `effect/Result`.

## What it is for

- result model and constructors. A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## API quick reference

- `getOrElse`
- `getOrNull`
- `fromOption`
- `getFailure`
- `getOrThrow`
- `getSuccess`
- `fromNullishOr`
- `getOrThrowWith`
- `getOrUndefined`
- `makeEquivalence`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `core` concern for `effect/Result`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Result } from "effect";

const parse = (input: string): Result.Result<number, string> =>
  isNaN(Number(input)) ? Result.fail("not a number") : Result.succeed(Number(input));

const ensurePositive = (n: number): Result.Result<number, string> =>
  n > 0 ? Result.succeed(n) : Result.fail("not positive");

const result = Result.flatMap(parse("42"), ensurePositive);

console.log(Result.getOrElse(result, (err) => `Error: ${err}`));
// Output: 42
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-result-combinators` (effect/Result#combinators)
  - `effect-facet-result-conversions` (effect/Result#conversions)
- Parent module ownership belongs to `effect-module-result`.

## Escalate to

- `effect-module-result` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Result.test.ts`
- Parent tests: `packages/effect/test/Channel.test.ts`
- Parent tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
