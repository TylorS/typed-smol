---
title: "Recover typed failures without losing causes"
summary: "Translate expected errors, retry subscriptions, and materialize complete outcomes deliberately."
section: "Fx"
kind: "guide"
order: 1.8
---

An Fx sends values through `A` and failures through a complete `Cause<E>`. Ordinary failing
producers end after that Cause is delivered; the low-level Sink protocol can also represent a
producer that reports a Cause and continues. Model expected business failures in `E`, while defects
and cancellation remain in the richer Cause. That distinction keeps a fallback for an unavailable
guide separate from a broken decoder or an owner ending the subscription.

## A guide request can be unavailable

Start by naming failures that a caller can reasonably act on. `Data.TaggedError` gives the failure a
stable tag and useful context. Here, a named Effect operation performs the one remote request, then
`Fx.fromEffect` puts that result into a push pipeline. [Building Fx values](/explore/building-fx)
covers the other ways to establish that source boundary.

```ts
import { Data, Effect, Schedule } from "effect";
import { Fx } from "@typed/fx";

class GuideUnavailable extends Data.TaggedError("GuideUnavailable")<{
  readonly slug: string;
}> {}

interface Guide {
  readonly slug: string;
  readonly body: string;
}

const fetchGuide = Effect.fn("fetchGuide")(function* (slug: string) {
  const request: Effect.Effect<Guide, GuideUnavailable> =
    slug === "network-down"
      ? Effect.fail(new GuideUnavailable({ slug }))
      : Effect.succeed({ slug, body: "Remote guide" });
  return yield* request;
});

const remoteGuide = (slug: string) => Fx.fromEffect(fetchGuide(slug));

const retriedGuide = (slug: string) => Fx.retry(remoteGuide(slug), Schedule.recurs(2));

const guideWithCache = (slug: string) =>
  retriedGuide(slug).pipe(
    Fx.catchTag("GuideUnavailable", ({ slug }) =>
      Fx.succeed<Guide>({ slug, body: "Cached guide" }),
    ),
  );
```

`catchTag` handles only the selected expected failure, and its handler receives the narrowed error.
Other tags remain visible to the caller. Use `mapError` when the owner merely needs to translate a
domain error, rather than choose an alternative producer; it is the error-channel counterpart to
the value changes in [Transforming Fx](/explore/transforming-fx).

```fx-marble
title: catch aliases switch to a fallback after the source fails
covers: catch, catchAll, catch_
input source: ^ guide . !offline
operator: catch / catchAll / catch_(fallback)
inner fallback: . . . . ^ cached |
output: . guide . . . cached |
```

`catch`, `catchAll`, and `catch_` are the same typed-failure recovery operation. The source keeps
values already delivered; after `!offline`, one fallback subscription starts and its values continue
the output. A fallback is not run until the source reports its failure.

```fx-marble
title: selective typed catches switch only for a matching failure
covers: catchTag, catchIf, catchTags
input source: ^ guide . !GuideUnavailable
operator: catchTag / catchIf / catchTags (matching failure)
inner fallback: . . . . ^ cached |
output: . guide . . . cached |
```

`catchTag` selects one tag, `catchIf` selects a typed failure with a predicate, and `catchTags` uses a
handler table for several tags. They share the same timing when the selection matches: one lazy
fallback starts after the failure. A rejected predicate, an unlisted tag, or an untagged error keeps
the original failure.

`retry` is deliberately outside `fetchGuide`: it retries the entire Fx subscription, including
acquisition and finalizers. `Schedule.recurs(2)` permits two retries after the first attempt. A
value resets the retry schedule, so it is a fit for a retryable producer—not for replaying an
arbitrary per-value callback. Give the schedule a bounded retry and backoff policy appropriate to
the operation. The retried source is still ordinary producer composition; see
[Composing Fx](/explore/composing-fx) when another producer also enters the decision.

## Recover one request without ending the input source

On a search screen, a failed request should usually leave the query listener alive. Put recovery
inside the function that creates that request. Catching outside the flattened pipeline replaces
the whole failed subscription, including its connection to future input.

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

type SearchResult =
  | { readonly _tag: "Results"; readonly query: string; readonly items: ReadonlyArray<string> }
  | { readonly _tag: "Unavailable"; readonly query: string }

const search = (query: string): Effect.Effect<ReadonlyArray<string>, "Offline"> =>
  query === "offline" ? Effect.fail("Offline" as const) : Effect.succeed([`Result for ${query}`])

const request = (query: string) => search(query).pipe(
  Effect.map((items): SearchResult => ({ _tag: "Results", query, items })),
  Effect.catch(() => Effect.succeed<SearchResult>({ _tag: "Unavailable", query })),
  Fx.fromEffect,
)

const results = Fx.fromIterable(["typed", "offline", "effect"]).pipe(Fx.concatMap(request))
const values = await Effect.runPromise(Effect.scoped(Fx.collectAll(results)))
// Results, Unavailable, Results: one failure did not stop later input.
```

This finite example uses `concatMap` to make every result observable. A live search usually uses
`switchMap(request)` so newer input also cancels obsolete requests. Recovery placement and
concurrency policy are separate decisions. For loading and refreshing alongside the result, use
[AsyncData](/explore/async-data) as the value model.

## Let the owner decide what a complete cause means

A typed recovery is not a general way to erase every ending. `Fx.catchTag` searches a terminal
Cause for its first expected failure. If its handler runs, the fallback replaces that entire source
termination; a Cause with no expected failure passes through unchanged. This matters when a failure
is accompanied by a defect or interruption.

Use `Fx.catchCause` only at a boundary that intentionally turns every kind of termination into a
new producer. For example, a host integration may choose to turn any failed subscription into one
status value after recording the full Cause.

```ts
import { Cause, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class SubscriptionRejected extends Data.TaggedError("SubscriptionRejected")<{
  readonly reason: string;
}> {}

const recordTermination = Effect.fn("recordTermination")((cause: Cause.Cause<unknown>) =>
  Effect.logError(Cause.pretty(cause)),
);

const source = Fx.fail(new SubscriptionRejected({ reason: "account paused" }));

const hostStatus = source.pipe(
  Fx.catchCause((cause) =>
    Fx.fromEffect(
      recordTermination(cause).pipe(
        Effect.as({ state: "unavailable" as const, detail: Cause.pretty(cause) }),
      ),
    ),
  ),
);
```

```fx-marble
title: catchCause replaces any terminal Cause with one fallback
covers: catchCause
input source: ^ . !decoder-defect
operator: catchCause(recordAndFallback)
inner fallback: . . . ^ unavailable |
output: . . . . unavailable |
```

`catchCause` receives the complete terminal `Cause`, including defects and interruption. It starts
the fallback after the source ends; the original Cause is no longer the downstream failure if that
fallback succeeds.

```fx-marble
title: catchCauseIf recovers only when its Cause predicate matches
covers: catchCauseIf
input source: ^ . !decoder-defect
operator: catchCauseIf(hasDies, fallback)
inner fallback: . . . ^ reported |
output: . . . . reported |
```

`catchCauseIf` has the same boundary timing, but forwards the unchanged Cause when its predicate
rejects it. Use it when the decision depends on Cause structure rather than only the typed error.

That broad conversion is a boundary policy, not a default. A defect is evidence that a programming
assumption failed; interruption says the subscription's owner stopped it. Keep both visible unless
the receiving system truly needs one normalized outcome. Use `Fx.onInterrupt` for cancellation-only
cleanup, rather than treating cancellation as a recoverable domain error.

## Observe failures without changing their meaning

Monitoring normally needs the complete Cause, but logging should not manufacture a fallback.
`Fx.onError` observes a terminal failure and preserves it for the downstream runner. Its callback
must not fail in the typed channel, which makes telemetry a side effect rather than a second
recovery policy.

```ts
import { Cause, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class GuideMalformed extends Data.TaggedError("GuideMalformed")<{
  readonly slug: string;
}> {}

const reportGuideFailure = Effect.fn("reportGuideFailure")((cause: Cause.Cause<GuideMalformed>) =>
  Effect.logError(Cause.pretty(cause)),
);

const checkedGuide = Fx.fail(new GuideMalformed({ slug: "effect-basics" })).pipe(
  Fx.onError(reportGuideFailure),
);

const terminalCauses = Fx.causes(checkedGuide);
```

```fx-marble
title: causes emits only the terminal Cause as a value
covers: causes
input source: ^ guide . !malformed
operator: causes
output: . . . Cause(malformed) |
```

`causes` drops successful values and turns the terminal Cause into one successful value before normal
completion. Defects and interruption remain inside that Cause value.

`Fx.causes` is useful when a supervisor genuinely consumes failure causes. Otherwise, keep the
failure in the Fx channel and let `Fx.observe`, `Fx.first`, or `Fx.collectAll` return the typed
Effect outcome to the owner, as chosen in [Consuming Fx](/explore/consuming-fx).

## Repeat a completed subscription, not a failed one

Refreshing a finished cache scan and retrying a failed network request are different policies.
`Fx.repeat` starts a fresh subscription only after normal completion; a source failure stops it
immediately. As with retry, every run is sequential and a schedule owns any delay between runs.

```ts
import { Schedule } from "effect";
import { Fx } from "@typed/fx";

const scanCache = (workspace: string) => Fx.succeed(`scanned:${workspace}`);

const threeScans = scanCache("typed").pipe(Fx.repeat(Schedule.recurs(2)));
```

This emits three completed scans: the original run plus two repeats. Pair retry and repeat only if
the product actually needs both boundaries; neither one provides a queue, deduplication, or
idempotency guarantee.

```fx-marble
title: retry resubscribes after failure and emits only the successful attempt
covers: retry
input attempt 1: ^ . !offline
input attempt 2: . . . ^ . ready |
operator: retry(Schedule.recurs(1))
output: . . . . . ready |
```

With an immediate `Schedule.recurs(1)`, the failed first subscription produces no downstream event;
the second subscription starts in the next logical slot after `!offline`, and its `ready` value is
the only output. A schedule with backoff would move the second `^` and `ready` later; retries are
sequential rather than concurrent.

## Carry outcomes as values only for a consumer that needs them

Most pipelines should end with their ordinary typed Effect result. Use `Fx.result` when the next
consumer must receive successes and terminal failures through the same value channel. The failed
`Result` retains `Cause`, so it does not flatten defects or interruption into a pretend domain error.

```ts
import { Cause, Data, Result } from "effect";
import { Fx } from "@typed/fx";

class GuideUnavailable extends Data.TaggedError("GuideUnavailable")<{
  readonly slug: string;
}> {}

const outcomes: Fx.Fx<Result.Result<string, Cause.Cause<GuideUnavailable>>, never> = Fx.result(
  Fx.fail(new GuideUnavailable({ slug: "error-recovery" })),
);
```

```fx-marble
title: exit materializes values and the terminal Cause without failing
covers: exit
input source: ^ guide . !offline
operator: exit
output: . Exit.succeed(guide) . Exit.failCause(offline) |
```

```fx-marble
title: result materializes values and the terminal Cause without failing
covers: result
input source: ^ guide . !offline
operator: result
output: . Result.succeed(guide) . Result.fail(Cause(offline)) |
```

`exit` and `result` each emit one success wrapper per source value, then one failure wrapper for the
terminal Cause. The wrapper is data, so the returned Fx completes normally and retains defects or
interruption instead of flattening them into a typed error.

## Translate typed errors without recovery

`mapError` changes only typed failures while preserving values and timing. It does not handle defects
or interruption; those remain in the Cause unchanged.

```fx-marble
title: mapError changes the typed failure but keeps values and timing
covers: mapError
input source: ^ guide . !offline
operator: mapError(toDomainError)
output: . guide . !DomainError
```

## Flip one channel into the other

`flip` inverts the channels: a typed failure becomes a successful value, while a source value becomes
the returned typed failure. The two cases below share one operator but show both terminal directions.

```fx-marble
title: flip turns typed failures into values and values into failures
covers: flip
input failure: ^ . !offline
input success: ^ . ready |
operator: flip
output failure: . . offline |
output success: . . !ready
```
