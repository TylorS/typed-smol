---
title: "Guards that can parse and ask for services"
summary: "Separate a normal non-match from an operation that failed while selecting or transforming input."
section: "Applications"
kind: "guide"
order: 5.8
---

A route selector or command dispatcher often needs three answers: this input matches, it does not
match, or the work needed to decide failed. `Guard<I, O, E, R>` makes that distinction explicit:
it is a function from `I` to `Effect<Option<O>, E, R>`.

`Some(output)` is a match. `None` lets another candidate try. A failure in `E` stops the operation
unless you explicitly recover it. A Guard is an ordinary function, so applying it to an input
returns an Effect; it does not start an independent subscription.

## Narrow before doing work

Start with a predicate when the decision is pure. Compose guards with `Guard.pipe`; it passes a
successful output to the next guard and skips the next guard on `None`.

```ts
import { Effect, pipe } from "effect"
import * as Guard from "@typed/guard"

const text = Guard.liftPredicate((input: unknown): input is string => typeof input === "string")
const nonEmptyText = pipe(
  text,
  Guard.map((value) => value.trim()),
  Guard.filter((value) => value.length > 0),
)

const accepted = await Effect.runPromise(nonEmptyText("  publish  "))
const absent = await Effect.runPromise(nonEmptyText("   "))
```

The module functions accept both data-first and data-last forms. Use Effect's `pipe` for transforming
the guard function itself; use `Guard.pipe` when composing two guard stages.

## Decide whether invalid input means non-match or failure

Schema decoding preserves a typed `SchemaError`. It does not quietly turn malformed input into
`None`. That matters when a URL matched a route but its parameter was invalid: silently trying
another route would lose the useful validation error.

```ts
import { Effect, pipe, Schema } from "effect"
import * as Guard from "@typed/guard"

const positivePage = pipe(
  Guard.fromSchemaDecode(Schema.NumberFromString),
  Guard.filter((page) => Number.isInteger(page) && page > 0),
)

const page = await Effect.runPromise(positivePage("3"))
const nonPositive = await Effect.runPromise(positivePage("0"))
const invalid = await Effect.runPromise(Effect.exit(positivePage("three")))
```

The results are `Some(3)`, `None`, and a failed Exit respectively. If your dispatcher deliberately
wants malformed values to count as a non-match, wrap the guard with `Guard.catchAll(() =>
Effect.succeedNone)`. Keep that policy close to the boundary that needs it. `fromSchemaEncode`
provides the reverse direction, while `decode` and `encode` compose a codec after an existing guard.

## Keep service dependencies in the guard type

A matched input can require an Effectful lookup. `mapEffect` runs only for `Some`, and its error
and service requirements become part of the resulting guard.

```ts
import { Context, Effect } from "effect"
import * as Guard from "@typed/guard"

class Commands extends Context.Service<Commands, {
  readonly describe: (name: string) => Effect.Effect<string>
}>()("app/Commands") {}

const command = Guard.mapEffect(
  Guard.liftPredicate((input: unknown): input is string => typeof input === "string"),
  (name) => Commands.pipe(Effect.flatMap((commands) => commands.describe(name))),
)

const result = command("publish").pipe(
  Effect.provideService(Commands, { describe: (name) => Effect.succeed(`Run ${name}`) }),
)

await Effect.runPromise(result)
```

A library can export this guard without choosing the Commands implementation. The application
provides it when running the returned Effect, or binds it using `Guard.provideService`.
`tap` adds an Effectful observation without changing matched output.

## Try named alternatives in order

`any` tries a record of guards in enumerable own-key order and stops at the first match. Its result
is tagged with the record key, so downstream code can distinguish which branch matched. A failed
branch is still a failure; only `None` falls through.

```ts
import { Effect } from "effect"
import * as Guard from "@typed/guard"

const command = Guard.any({
  Help: Guard.liftPredicate((input: string) => input === "help"),
  Search: Guard.liftPredicate((input: string) => input.startsWith("search ")),
})

const matched = await Effect.runPromise(command("search effects"))
// Some({ _tag: "Search", value: "search effects" })
```

Put specific cases before broad catch-alls. Test overlapping inputs as well as successful and absent
inputs: branch ordering is application behavior.

## Let library values participate without inheriting a class

A `GuardInput` is either a guard function or an object with an `asGuard` method. Use the focused
`getGuard` entry point when your library accepts both. The adapter method must be its own callable
property, and must return a function; invalid adapters throw immediately during normalization.

```ts
import { Effect, Option } from "effect"
import type { GuardInput } from "@typed/guard"
import { getGuard } from "@typed/guard/getGuard"

const execute = (input: GuardInput<string, string>, value: string) => getGuard(input)(value)
const selection = {
  asGuard: () => (value: string) => Effect.succeed(value === "save" ? Option.some(value) : Option.none()),
}

await Effect.runPromise(execute(selection, "save"))
```

Continue with [typed URL inputs](/explore/route-typed-url-inputs) to see this contract at a routing
boundary, or use the [Guard reference](/reference/modules/%40typed%2Fguard) for binding, tagging,
recovery, and service combinators. Effect's [services guide](https://www.effect.website/docs/v4/requirements-management/services/)
explains how those requirements are supplied.
