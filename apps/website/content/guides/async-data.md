---
title: "Async data without loading flags"
summary: "Represent loading, refreshes, failure, and optimistic edits as values that work in any renderer."
section: "State"
kind: "guide"
order: 2.4
---

A results page needs more than a value and a `loading` boolean. It needs to distinguish a search
that has not started, a first request, cached results being refreshed, and a failed request.
`@typed/async-data` gives those states one structural union. It describes work; Effect and Fx still
own execution, cancellation, and request ordering.

## Keep the previous result while refreshing

`AsyncData<A, E>` has five variants. `Success` and `Failure` can carry progress while a refresh is
running, so refreshing does not require throwing away the previous result.

| State | What the application knows |
| --- | --- |
| `NoData` | No request result exists yet. |
| `Loading` | Work is running without a previous result. |
| `Success` | A value is available; optional progress marks a refresh. |
| `Failure` | A complete `Cause<E>` is available; optional progress marks a retry. |
| `Optimistic` | A provisional value and the exact state it replaced are available. |

```ts
import * as AsyncData from "@typed/async-data"

const cached = AsyncData.success(["Ada", "Grace"])
const refreshing = AsyncData.startLoading(cached, { loaded: 0 })
const settled = AsyncData.stopLoading(refreshing)

// Both refreshing and settled still contain the cached names.
const names = AsyncData.getSuccess(refreshing)
```

`startLoading` preserves a previous success or failure and attaches progress. Starting from
`NoData` produces `Loading`. `stopLoading` removes refresh progress from a success or failure;
it leaves `Loading` as `Loading`, so it is not a general reset operation. Set `NoData` explicitly
when that is the intended transition.

## Connect a request to current state

Store the union in a RefSubject when commands and views need to share it. Capture a request's
`Exit` to preserve its complete failure Cause, then turn that result into data.

```ts
import { Data, Effect } from "effect"
import * as AsyncData from "@typed/async-data"
import { RefSubject } from "@typed/fx"

type Profile = { readonly name: string }
class ProfileError extends Data.TaggedError("ProfileUnavailable")<{}> {}

const loadProfile: Effect.Effect<Profile, ProfileError> = Effect.succeed({ name: "Ada" })

const program = Effect.gen(function* () {
  const profile = yield* RefSubject.make<AsyncData.AsyncData<Profile, ProfileError>>(AsyncData.NoData)
  yield* RefSubject.update(profile, AsyncData.startLoading)
  const result = yield* Effect.exit(loadProfile)
  yield* RefSubject.set(profile, AsyncData.fromExit(result))
  return yield* profile
}).pipe(Effect.scoped)

await Effect.runPromise(program)
```

Here `ProfileError` lives inside the state value. The ref itself has no expected-error channel
because reading a `Failure` value is a successful state read. This lets a view render failures
without ending its observation. `getError` extracts an expected error when one exists; `getCause`
retains defects and interruption too.

This example runs one request. For a live search, put request work inside
[`Fx.switchMap`](/explore/fx-higher-order-and-concurrency) so a new query interrupts old work.
For writes that must finish in order, use `concatMap`. AsyncData does not settle races or deduplicate
requests on your behalf.

## Render every state deliberately

`match` requires all five branches. A refresh can keep useful content visible and display a small
progress indicator alongside it. The same fold can produce text, a template, or another value.

```ts
import * as AsyncData from "@typed/async-data"

type Profile = { readonly name: string }

const describeProfile = (data: AsyncData.AsyncData<Profile, string>) =>
  AsyncData.match(data, {
    NoData: () => "Choose a profile",
    Loading: () => "Loading profile…",
    Success: (profile, state) => `${profile.name}${state.progress ? " (refreshing)" : ""}`,
    Failure: () => "Profile unavailable. Try again.",
    Optimistic: (profile) => `${profile.name} (saving)`,
  })

const label = describeProfile(AsyncData.success({ name: "Ada" }))
```

`getSuccess` includes a current optimistic value. `isSuccess` matches only the `Success` variant.
Use `isPending` as a status boolean: it follows optimistic history, but its current TypeScript
predicate does not include every optimistic wrapper that can return `true`. Check `_tag` separately
before reading variant-specific fields.

## Make rollback explicit

An optimistic value retains the entire previous state, including refresh progress or an earlier
optimistic edit. Restore `previous` to undo one layer; commit a fresh success after the server accepts
it. The constructors do not execute a mutation or perform rollback automatically.

```ts
import * as AsyncData from "@typed/async-data"

const saved = AsyncData.success({ name: "Ada" })
const pending = AsyncData.optimistic(saved, { name: "Augusta" })
const rolledBack = pending.previous
const accepted = AsyncData.success(pending.value)
```

For overlapping edits, the application must decide which response owns the latest state. Restoring
an old `previous` after a newer edit can discard that edit. Serialize mutations or carry an operation
identity and reconcile responses against it.

## Validate data crossing a boundary

`AsyncData.AsyncData(valueSchema, errorSchema)` builds a codec for the entire union, including
recursive optimistic history and encoded Causes. A structural `isAsyncData` check recognizes the
wrapper; it does not validate an arbitrary success payload against your application model.

```ts
import { Schema } from "effect"
import * as AsyncData from "@typed/async-data"

const ProfileState = AsyncData.AsyncData(
  Schema.Struct({ name: Schema.String }),
  Schema.String,
)
const encoded = Schema.encodeSync(ProfileState)(AsyncData.success({ name: "Ada" }))
const restored = Schema.decodeUnknownSync(ProfileState)(encoded)
```

See the [AsyncData reference](/reference/modules/%40typed%2Fasync-data) for transformations such as
`map`, `flatMap`, and `mapError`; [RefSubject state](/explore/refsubject-renderer-independent-state)
for ownership; and [Effect errors](https://www.effect.website/docs/v4/error-management/expected-errors/)
for the distinction between expected failures and defects.
