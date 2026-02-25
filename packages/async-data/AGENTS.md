# @typed/async-data

## Intent

`@typed/async-data` models the full lifecycle of remote/fetch data in UI: **NoData** (not yet requested), **Loading** (in flight), **Success** (data ready), **Failure** (error), and **Optimistic** (local update before server confirms). Use it for loading spinners, error UIs, refresh-in-place, and optimistic updates.

## Capabilities

- **State model:** Exhaustive union; every remote datum has exactly one state. Type-safe guards (`isSuccess`, `isLoading`, etc.) and pattern matching (`match`) for exhaustive branching.
- **Progress:** `Progress: { loaded, total? }` on Loading, Success, Failure — enables progress bars, skeleton-with-refresh, and "refreshing" overlays without a separate state.
- **Refreshing:** Success/Failure with `progress` set = "refreshing." Helpers `startLoading`, `stopLoading` for transition; `isRefreshing`, `isPending` to detect in-progress.
- **Optimistic updates:** `optimistic(previous, value)` preserves `previous` so rollback is trivial; `map`/`flatMap`/`mapError` recur into `previous` to keep semantics consistent.
- **Effect integration:** `fromExit`/`fromResult`; `AsyncData(A, E)` builds Effect Schema codec for serialization (e.g., hydration, persistence, RPC).

## Key exports / surfaces

- **Types:** `AsyncData<A, E>`, `Progress`, `Refreshing<A, E>`
- **Constructors:** `NoData`, `loading(progress?)`, `success(value, progress?)`, `failure(cause, progress?)`, `optimistic(previous, value)`
- **Guards:** `isNoData`, `isLoading`, `isSuccess`, `isFailure`, `isOptimistic`, `isRefreshing`, `isPending`, `isAsyncData`
- **Pattern matching:** `match(data, { NoData, Loading, Success, Failure, Optimistic })`
- **Helpers:** `startLoading`, `stopLoading`; `getSuccess`, `getCause`, `getError`
- **Transformers:** `map`, `flatMap`, `mapError`; `fromExit`, `fromResult`
- **Schema:** `AsyncData(A, E)` — Effect Schema codec
- Dependencies: `effect` only

## Constraints

- Effect skill loading when modifying Effect-related patterns: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for full API reference and examples
- Root AGENTS.md for bootup/modes
