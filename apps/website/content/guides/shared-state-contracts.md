---
title: Shared state contracts
summary: Provide renderer-independent state through Effect Context without making a global mutable singleton.
section: State
kind: guide
order: 2.35
---

Use `RefSubject.Service` when independently constructed code needs one shared state contract: routes,
commands, a worker adapter, a reusable UI component, or an application model. Do not use it merely
to avoid passing a local value through one function. Local state is easier to understand when its
owner is already obvious.

Effect Context is an explicit dependency map. A `Layer` is the recipe that builds and provides one
or more dependencies for a running program. In the examples, the Layer owns construction of the
state; consumers only ask for the `CounterState` contract. See Effect's
[services guide](https://www.effect.website/docs/v4/requirements-management/services/) and
[Layer guide](https://www.effect.website/docs/v4/requirements-management/layers/) for the general
model. A Scope still owns resource cleanup for live sources used to initialize the ref.

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
