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

## API Reference

### Types

- **`Guard<I, O, E, R>`** — Core guard type: `(input: I) => Effect.Effect<Option.Option<O>, E, R>`.
- **`Guard.Input<T>`**, **`Guard.Output<T>`**, **`Guard.Error<T>`**, **`Guard.Services<T>`** — Type-level extractors for a guard or `AsGuard` type.
- **`AsGuard<I, O, E, R>`** — Interface with `asGuard(): Guard<I, O, E, R>` for types that can be used as guards.
- **`GuardInput<I, O, E, R>`** — Union `Guard<I, O, E, R> | AsGuard<I, O, E, R>`; accepted wherever a guard is expected.
- **`AnyInput<GS>`**, **`AnyOutput<GS>`** — Input and output types for `any(guards)`; `AnyOutput<GS>` is a tagged union `{ _tag: K; value: Guard.Output<GS[K]> }`.

### Core

- **`getGuard(guard)`** — Normalizes a `GuardInput` to a `Guard` (unwraps `AsGuard`).

### Composition

- **`pipe(input, output)`** — Chains two guards; the second runs on the first’s output when the first succeeds. Signature: `(input, output) => Guard<I, B, E | E2, R | R2>`.
- **`map(guard, f)`** — Maps the guard’s output with a pure function. Dual (data-first / data-last).
- **`mapEffect(guard, f)`** — Maps the guard’s output with an Effect. Dual.
- **`filter(guard, predicate)`** — Keeps only outputs that satisfy the predicate (type refinement or boolean). Dual.
- **`filterMap(guard, f)`** — Transforms output to `Option<B>`; `None` means no match. Dual.
- **`tap(guard, f)`** — Runs a side effect (or Effect) on the output and passes the original output through. Dual.

### Building

- **`liftPredicate(predicate)`** — Builds a guard from a predicate. With a refinement `(a: A) => a is B`, output is narrowed to `B`; otherwise `Guard<A, A>`.

```ts
liftPredicate<A, B extends A>(predicate: (a: A) => a is B): Guard<A, B>;
liftPredicate<A>(predicate: (a: A) => boolean): Guard<A, A>;
```

- **`any(guards)`** — Takes an object of named guards and returns a guard whose input is the intersection of all guard inputs and whose output is the tagged union `{ _tag: key; value: output }`. Tries each guard in order and returns the first match.

### Schema

- **`fromSchemaDecode(schema)`** — Builds a guard from an Effect Schema: input is the schema’s encoded type, output is the schema’s type. Uses `Schema.decodeEffect`.
- **`fromSchemaEncode(schema)`** — Builds a guard from an Effect Schema: input is the schema’s type, output is the encoded type. Uses `Schema.encodeEffect`.
- **`decode(guard, schema)`** — Composes the guard with schema decoding (pipe with `fromSchemaDecode(schema)`). Dual.
- **`encode(guard, schema)`** — Composes the guard with schema encoding (pipe with `fromSchemaEncode(schema)`). Dual.

### Effect integration

- **`provide(guard, provided)`** — Provides a `ServiceMap` or `Layer` to the guard’s environment.
- **`provideService(guard, tag, service)`** — Provides a single service to the guard’s environment.
- **`provideServiceEffect(guard, tag, effect)`** — Provides a service via an Effect to the guard’s environment.
- **`catchAll(guard, f)`** — Recovers from any error by running `f` and treating its result as a successful match. Alias: **`catch`**.
- **`catchTag(guard, tag, f)`** — Recovers from a specific tagged error.
- **`catchCause(guard, f)`** — Recovers from the full `Cause` of the guard’s failure.

### Struct helpers

- **`addTag(guard, value)`** — Adds a readonly `_tag` property to the guard’s output. Dual.
- **`bindTo(guard, key)`** — Wraps the guard’s output in an object under the given key: `{ [key]: O }`. Dual.
- **`bind(guard, key, f)`** — Runs a second guard on the first’s output and merges the result under `key` into the output object. Dual.
- **`let(guard, key, value)`** — Adds a fixed property to the guard’s output. Dual.

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
