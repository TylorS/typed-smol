---
title: "Choosing specialized RefSubject modules"
summary: "Use domain-shaped transitions for arrays, optional values, object fields, and Effect collections."
section: "State"
kind: "guide"
order: 2.2
---

A selected row is optional. A checklist is an array. An expanded panel is a boolean. Specialized
RefSubject modules give these familiar shapes named transitions and derived queries while retaining
the same current read, Fx observation, and Scope ownership as an ordinary RefSubject.

Start with the representation your model already uses. These modules do not require a new store
architecture; their operations accept compatible RefSubjects.

## Append records and derive their labels

`RefArray.append` is a write. `RefArray.mapValues` is a read-only projection. Keeping that distinction
visible prevents a view from accidentally changing its source while computing display data.

```ts
import { Effect } from "effect"
import * as RefArray from "@typed/fx/RefArray"

type Task = { readonly id: string; readonly title: string }

const program = Effect.gen(function* () {
  const tasks = yield* RefArray.make<Task>([])
  const titles = RefArray.mapValues(tasks, (task) => task.title)
  const count = RefArray.length(tasks)

  yield* RefArray.append(tasks, { id: "task-1", title: "Write the guide" })
  yield* RefArray.append(tasks, { id: "task-2", title: "Check the examples" })
  return { titles: yield* titles, count: yield* count }
}).pipe(Effect.scoped)

await Effect.runPromise(program)
```

Use `RefSubject.update` with an immutable array transformation for transitions that do not have a
matching helper. Preserve each record's identity when updating its content; the renderer can use
that stable key in [keyed collections](/explore/keyed-template-collections).

The current `RefArray.map` API has a declaration/runtime mismatch: its declaration says Computed,
but executing it performs a write. Use `mapValues` for projections and `RefSubject.update` for array
rewrites until that API is corrected. `head`, `last`, and `getIndex` produce conditional views
because the requested element may not exist.

## Keep selection optional

`RefOption` retains `Option<A>` as writable state. Its `getValue` query is a `Filtered<A>`: a current
read fails with `NoSuchElementError` while absent, and its Fx side emits only present selections.
Use `getOrElse` when the display has a meaningful fallback.

```ts
import { Effect, Option } from "effect"
import * as RefOption from "@typed/fx/RefOption"

const program = Effect.gen(function* () {
  const selectedId = yield* RefOption.make(Option.none<string>())
  const label = RefOption.getOrElse(selectedId, () => "Nothing selected")

  const emptyLabel = yield* label
  yield* RefOption.setSome(selectedId, "invoice-42")
  const selectedLabel = yield* label
  yield* RefOption.setNone(selectedId)
  return { emptyLabel, selectedLabel, selection: yield* selectedId }
}).pipe(Effect.scoped)

await Effect.runPromise(program)
```

Keep `Option` in the contract when downstream code must react to deselection as well as selection.
A Filtered observation skips absence, so it cannot by itself tell a view to clear an earlier value.

## Update one field without splitting one model

`RefStruct` stores a whole object and checks field names and values at the transition boundary.
`get` creates a read-only field query; `set` and `update` write a field through the parent ref.

```ts
import { Effect } from "effect"
import * as RefStruct from "@typed/fx/RefStruct"

const program = Effect.gen(function* () {
  const draft = yield* RefStruct.make({ title: "Untitled", published: false })
  const title = RefStruct.get(draft, "title")

  yield* RefStruct.set(draft, "title", "A useful guide")
  yield* RefStruct.merge(draft, { published: true })
  return { title: yield* title, draft: yield* draft }
}).pipe(Effect.scoped)

await Effect.runPromise(program)
```

Separate field writes remain separate commits. When several fields must change together, use one
`merge` or one parent `RefSubject.update`. `RefTuple` provides the corresponding typed index
operations for a fixed positional model. `RefSubject.proxy` is useful when only read-only field
queries are needed.

## Choose the smallest useful module

| Model representation | Modules to explore |
| --- | --- |
| Flags and text | `RefBoolean`, `RefString` |
| Arrays and fixed products | `RefArray`, `RefTuple`, `RefStruct`, `RefRecord` |
| Absence and outcomes | `RefOption`, `RefResult`, `RefCause` |
| Numeric and temporal values | `RefBigInt`, `RefBigDecimal`, `RefDuration`, `RefDateTime` |
| Effect collections | `RefChunk`, `RefHashMap`, `RefHashSet`, `RefIterable` |
| Specialized indexes | `RefTrie`, `RefGraph`, `RefHashRing` |

Each module has its own domain behavior. An index lookup can be absent; a structural edit can have
constraints; a conversion can fail. Read the operation's return type instead of assuming every
function is a write or that every query always has a value.

For example, a panel can retain a boolean and expose a derived collapsed flag without introducing
another mutable value:

```ts
import { Effect } from "effect"
import * as RefBoolean from "@typed/fx/RefBoolean"

const program = Effect.gen(function* () {
  const expanded = yield* RefBoolean.make(false)
  const collapsed = RefBoolean.not(expanded)
  yield* RefBoolean.toggle(expanded)
  return yield* collapsed
}).pipe(Effect.scoped)

await Effect.runPromise(program) // false
```

All of these models can be tested without rendering. See [state transactions](/explore/state-transactions-and-bidirectional-views)
for changes that return a separate result, [Versioned state](/explore/versioned-state) for adapting
an independently owned producer, and the [Fx package reference](/reference/modules/%40typed%2Ffx)
for each specialized module's complete operations.
