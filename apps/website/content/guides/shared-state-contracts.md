---
title: Shared reactive contracts
summary: Use Effect Context to share exactly the reactive capability another subsystem needs.
section: State
kind: guide
order: 2.35
---

Effect Context is useful when independently constructed code needs the same reactive capability:
routes, commands, a worker adapter, a reusable UI component, or an application model. It is not a
reason to turn every local value into a global. First choose the smallest contract the consumer
actually needs.

| Contract | It exposes | Use it for |
| --- | --- | --- |
| `Fx.Service` | an Fx producer | a replaceable feed, clock, transport, or domain stream |
| `Sink.Service` | a write boundary | logs, telemetry, persistence, or outbound commands |
| `Subject.Service` | both Fx and Sink | multicasting named events without a current value |
| `RefSubject.Service` | current Effect read, Fx, and writes | shared state with named transitions |

This is dependency injection, not a singleton pattern. The class declares a requirement; a `Layer`
installs one implementation at an application, request, or test boundary. Consumers retain their
typed `E` and `R` channels, while tests replace the concrete implementation without patching a
module-global object.

Effect Context is an explicit dependency map. A `Layer` is the recipe that builds and provides one
or more dependencies for a running program. See Effect's
[services guide](https://www.effect.website/docs/v4/requirements-management/services/) and
[Layer guide](https://www.effect.website/docs/v4/requirements-management/layers/) for the general
model. A Scope still owns resource cleanup for live sources and subscriptions installed by a Layer.

## Name the capability, then install an implementation

Each service facade is directly usable as the same Fx, Sink, Subject, or RefSubject capability it
describes. The Layer constructor is where the application chooses the implementation.

```ts
import { Effect } from "effect"
import { Fx, RefSubject, Sink, Subject } from "@typed/fx"

class Ticks extends Fx.Service<Ticks, number>()("app/Ticks") {}
class Audit extends Sink.Service<Audit, string>()("app/Audit") {}
class Notifications extends Subject.Service<Notifications, string>()("app/Notifications") {}
class SessionState extends RefSubject.Service<SessionState, { readonly signedIn: boolean }>()(
  "app/SessionState",
) {}

const TicksLive = Ticks.make(Fx.fromIterable([1, 2, 3]))
const AuditLive = Audit.make(Effect.logError, Effect.log)
const NotificationsLive = Notifications.make(1)
const SessionStateLive = SessionState.make({ signedIn: false })
```

`Ticks` can only be consumed. `Audit` can only receive values. `Notifications` adds observation to
publication, but has no current value. `SessionState` adds a current read and serialized writes.
That capability difference is visible to TypeScript before any implementation is provided.

## Define the state contract once

`RefSubject.Service<Self, A, E>()("id")` creates a service facade that is simultaneously a current
Effect read, an Fx source of committed values, and a writable RefSubject. Its `make` method returns a
Layer that constructs the ref. The service identifier is a dependency key, not a process-wide global
object.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

interface Counter {
  readonly value: number;
}

class CounterState extends RefSubject.Service<CounterState, Counter>()("example/CounterState") {}

const CounterStateLive = CounterState.make({ value: 0 });

const increment = RefSubject.update(CounterState, (current) => ({
  value: current.value + 1,
}));

const program = Effect.scoped(
  Effect.gen(function* () {
    yield* increment;
    return yield* CounterState;
  }).pipe(Effect.provide(CounterStateLive)),
);

await Effect.runPromise(program); // { value: 1 }
```

The consumer does not know whether the Layer uses a plain initial value, an Effect, or an Fx source.
That decision remains at the composition edge. A test can provide a different `CounterState` Layer
without replacing globals or mounting a renderer.

## Expose read-only service views to consumers

When a consumer should not write shared state, derive the view before handing it out.
`computedFromService` defers service lookup and returns a read-only `Computed`; `filteredFromService`
does the same for a conditionally available `Filtered`. Both preserve the state source's typed errors
and required services plus the service requirement itself.

```ts
import { Effect, Option } from "effect";
import { RefSubject } from "@typed/fx";

interface Search {
  readonly query: string;
}

class SearchState extends RefSubject.Service<SearchState, Search>()("example/SearchState") {}

const SearchStateLive = SearchState.make({ query: "" });

const normalizedQuery = RefSubject.computedFromService(
  Effect.map(SearchState.service, (state) =>
    RefSubject.map(state, ({ query }) => query.trim()),
  ),
);

const submittedQuery = RefSubject.filteredFromService(
  Effect.map(SearchState.service, (state) =>
    RefSubject.filterMap(state, ({ query }) => {
      const normalized = query.trim();
      return normalized.length === 0 ? Option.none<string>() : Option.some(normalized);
    }),
  ),
);

const program = Effect.scoped(
  Effect.gen(function* () {
    yield* RefSubject.set(SearchState, { query: "  Typed  " });
    return {
      normalized: yield* normalizedQuery,
      submitted: yield* submittedQuery,
    };
  }).pipe(Effect.provide(SearchStateLive)),
);

await Effect.runPromise(program);
```

This keeps capability obvious in the type: code receiving `normalizedQuery` or `submittedQuery` can
read and observe, but cannot write. Code that owns a named transition depends on `SearchState` and
uses `RefSubject.update` or `set` at the state boundary.

## Put ownership at the right composition edge

A Layer is appropriate when several separate programs need the same state lifetime. It is not an
instruction to put every form field in Context. Keep a request-local ref in that request's Scope;
keep a component-specific ref with the composition that owns the component; use a service when the
state genuinely crosses those construction boundaries.

The service facade works equally for application and library code. An application can provide the
live model to routes and views. A library can require the contract without choosing where it is
constructed. `@typed/ui` components should normally receive the particular state they borrow rather
than secretly installing a service, preserving the same ownership boundary described in
[RefSubject: state without a renderer](/explore/refsubject-renderer-independent-state). For the
complete relationship between writable, computed, and filtered state, see
[Composing RefSubject state](/explore/composing-refsubject-state).
