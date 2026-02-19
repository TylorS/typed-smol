# @typed/guard

> **Beta:** This package is in beta; APIs may change.

`@typed/guard` provides **Effect-based guards**: functions that take an input and produce `Effect<Option<O>, E, R>`. Guards can be composed with `pipe`, `map`, `filter`, `bind`, and integrated with Effect Schema (`fromSchemaDecode` / `fromSchemaEncode`, `decode` / `encode`). Use them for validation, parsing, and route matching when you want a composable “maybe this input becomes this output” with effects.

## Dependencies

- `effect`

## API overview

- **Type:** `Guard<I, O, E, R>` — `(input: I) => Effect.Effect<Option.Option<O>, E, R>`; `GuardInput` = Guard | AsGuard.
- **Composition:** `getGuard`, `pipe` (chain guards), `map`, `mapEffect`, `filter`, `filterMap`, `tap`.
- **Building:** `liftPredicate` (from predicate); `any(guards)` for tagged unions.
- **Schema:** `fromSchemaDecode(schema)`, `fromSchemaEncode(schema)`; `decode(guard, schema)`, `encode(guard, schema)`.
- **Effects:** `provide`, `provideService`, `provideServiceEffect`; `catchAll`, `catchTag`, `catchCause`.
- **Struct helpers:** `addTag`, `bindTo`, `bind`, `let`.

## Example

```ts
import { Effect, Option } from "effect";
import * as Guard from "@typed/guard";
import * as Schema from "effect/Schema";

const Positive = Schema.Number.pipe(Schema.positive());
const guardDecode = Guard.fromSchemaDecode(Positive);

// Inside Effect.gen(function* () { ... })
const result = yield* guardDecode(42).pipe(
  Effect.map(Option.match({
    onNone: () => "invalid",
    onSome: (n) => `ok: ${n}`,
  })),
);
// result === "ok: 42"

const even = Guard.liftPredicate((n: number) => n % 2 === 0);
const positiveEven = Guard.pipe(guardDecode, even);
```
