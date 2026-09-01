---
title: Provide services and own subscriptions
summary: Keep Effect requirements explicit while giving each Fx run a clear Layer, Scope, and shutdown boundary.
section: Fx
kind: guide
order: 1.9
---

Imagine one market-price monitor that should run for the lifetime of a workflow. The price socket is
a service because the process needs it; the audit sink is another service because observation needs
it. Keep both requirements in the types until the owner chooses their live Layers. This assumes the
source and its transformations are already chosen: [Building Fx values](/explore/building-fx),
[Transforming Fx](/explore/transforming-fx), and [Composing Fx](/explore/composing-fx) cover those
choices.

The marbles on this page are subscription diagrams, not value-transform diagrams. The value lane is
usually unchanged; named service, resource, lifecycle, and trace lanes show the work that happens
around it.

```ts
import { Context, Effect, Fiber, Layer } from "effect";
import { Fx } from "@typed/fx";

interface Quote {
  readonly symbol: string;
  readonly cents: number;
}

class MarketFeed extends Context.Service<
  MarketFeed,
  {
    readonly open: Effect.Effect<{
      readonly quotes: Fx.Fx<Quote>;
      readonly close: Effect.Effect<void>;
    }>;
  }
>()("app/MarketFeed") {}

class PriceAudit extends Context.Service<
  PriceAudit,
  { readonly write: (quote: Quote) => Effect.Effect<void> }
>()("app/PriceAudit") {}

const quotes: Fx.Fx<Quote, never, MarketFeed> = Fx.genScoped(function* () {
  const feed = yield* MarketFeed;
  const socket = yield* Effect.acquireRelease(feed.open, (socket) => socket.close);
  return socket.quotes;
});

const MarketFeedLive = Layer.succeed(MarketFeed, {
  open: Effect.succeed({
    quotes: Fx.periodic("1 second").pipe(Fx.map(() => ({ symbol: "TYPED", cents: 12_345 }))),
    close: Effect.log("market socket closed"),
  }),
});

const PriceAuditLive = Layer.succeed(PriceAudit, {
  write: Effect.fn(function* (quote: Quote) {
    yield* Effect.log(`${quote.symbol}: ${quote.cents}`);
  }),
});

const observeQuotes = Fx.observe(
  quotes.pipe(Fx.provide(MarketFeedLive)),
  Effect.fn(function* (quote: Quote) {
    const audit = yield* PriceAudit;
    yield* audit.write(quote);
  }),
).pipe(Effect.provide(PriceAuditLive));

// The host owns this root Fiber and interrupts it during shutdown.
const monitorFiber = Effect.runFork(observeQuotes);
const stopMarketMonitor = () => Effect.runPromise(Fiber.interrupt(monitorFiber));
```

`Fx.provide` builds `MarketFeedLive` for this subscription; it does not erase failure or dependency
information the Layer itself introduces. `Fx.genScoped` then gives `open`, `quotes`, and `close` one
subscription Scope. When the host calls `stopMarketMonitor`, it interrupts the observer, which
closes the Fx Scope and runs `socket.close`. The owner can instead await `observeQuotes` directly
when completion or failure is part of the workflow's result.

## Own resourceful setup for one subscription

`genScoped` runs its generator and returned Fx in one child Scope for each subscription. Resources
acquired during setup remain alive while values flow, then release after completion, failure, or
interruption; no caller Scope requirement escapes from that ownership boundary.

```fx-marble
title: genScoped keeps a resource alive through its subscription and releases it afterward
covers: genScoped
input setup: ^ open ready . . |
operator: genScoped(function*)
inner resource scope: . ^ socket . . close |
inner selected Fx: . . ^ a b | .
output values: . . . a b . |
```

`genScoped` keeps the acquired resource open for exactly one subscription and removes `Scope` from
the returned Fx's requirements.

## Provide services without changing values

`provide` builds a Layer for every subscription, makes its services available to the whole run, and
closes that Layer Scope after the source exits. The source values remain the same.

```fx-marble
title: provide acquires a Layer before forwarding the source values and releases it afterward
covers: provide
input source: . . ^ a b | .
operator: provide(MarketFeedLive)
inner service Layer: ^ build ready . . release |
output values: . . . a b . |
```

`provideContext` and `provideService` instead reuse instances their caller already owns. They make
them available for each run but neither acquire nor finalize them.

```fx-marble
title: existing services stay available while provideContext and provideService forward values
covers: provideContext, provideService
input source: ^ a b |
operator: provideContext(context) / provideService(Config, value)
inner existing service: ready ready ready ready
output values: . a b |
```

`provideServiceEffect` is the effectful convenience form. Its service Effect runs once when a
subscription starts; a failed acquisition prevents the source from starting. If that Effect itself
needs `Scope`, the returned Fx still requires a caller-owned Scope.

```fx-marble
title: provideServiceEffect runs one service Effect before forwarding the source values
covers: provideServiceEffect
input source: . . ^ a b |
operator: provideServiceEffect(Config, makeConfig)
inner service effect: ^ acquire ready . . |
output values: . . . a b |
```

Prefer the existing-value forms when the application already owns the instance. Use the effectful
form only when acquisition belongs to each subscription; a named Layer is clearer when that setup
has more than one service or a reusable lifecycle.

## Keep one lifetime per stable key

`keyed` gives each newly added key a `RefSubject` and child Scope. Updating or moving a stable key
reuses that child; removing it closes only its child Scope. Its returned Fx retains the outer Scope
requirement, because the parent owns the key workers and any remaining children.

```fx-marble
title: keyed reuses b, closes removed a, and creates c under separate child scopes
covers: keyed
input collections: ^ [a,b] . [b,c] |
operator: keyed({ getKey, onValue })
inner key a scope: . ^ a close |
inner key b scope: . ^ b b |
inner key c scope: . . . ^ c |
output ready rows: . . [a,b] . [b,c] |
```

## Attach terminal lifecycle work

`ensuring` runs its finalizer after every terminal outcome. `onExit` also runs after every terminal
outcome, but receives the `Exit` so it can distinguish completion from failure or interruption. The
diagram shows the successful case; the value lane is only delayed at terminal completion until the
lifecycle Effect finishes.

```fx-marble
title: ensuring and onExit forward values, then run terminal lifecycle work
covers: ensuring, onExit
input source: ^ a b | .
operator: ensuring(close) / onExit(recordExit)
inner lifecycle: . . . finalize |
output values: . a b . |
```

`onInterrupt` is narrower: ordinary completion and typed failure do not invoke it. When the source
reports an interrupt or its observing Fiber is interrupted, cleanup runs before the cancellation is
finished; make cleanup idempotent if both paths can occur.

```fx-marble
title: onInterrupt forwards prior values and runs cancellation cleanup only for interruption
covers: onInterrupt
input source: ^ a . x .
operator: onInterrupt(abort)
inner interruption lifecycle: . . . abort |
output values: . a . . x
```

`onError` is failure-only observation. It delivers the original failure downstream first, then runs
cleanup only if that delivery succeeds; cleanup has no typed-error channel, but its defect or
interruption can still affect the run.

```fx-marble
title: onError forwards the original failure before starting failure-only cleanup
covers: onError
input source: ^ a . !offline . .
operator: onError(logCause)
inner error lifecycle: . . . . log |
output values: . a . !offline . .
```

## Trace the whole subscription

`withSpan` preserves values, errors, and requirements. It creates one span for the source run and a
child delivery span for each downstream success or failure callback, so tracing includes the push
boundary rather than only setup.

```fx-marble
title: withSpan adds trace lifetimes around an otherwise unchanged subscription
covers: withSpan
input source: ^ a b |
operator: withSpan("market monitor")
inner trace span: ^ . . |
inner delivery spans: . success(a) success(b) |
output values: . a b |
```

## Put background infrastructure in an application Layer

If the monitor is application infrastructure rather than one workflow, `Fx.observeLayer` gives it
the application's Layer Scope. Recover or report source and observer failures before doing this:
Layer acquisition does not await the background Fiber's exit. `Fx.drainLayer` is the equivalent
when the Fx already performs the useful work and values need no observer. [Consuming Fx](/explore/consuming-fx)
has the runner trade-offs.

Every independent subscription above opens its own socket. Share only when two consumers genuinely
need the same live connection: public `Subject.multicast(quotes)` from `@typed/fx/Subject` shares
one active execution, has no replay for late subscribers, and stops it when the final subscriber
leaves. It adds a `Scope` requirement, so the shared connection still has an explicit owner.
