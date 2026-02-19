# @typed/async-data

> **Beta:** This package is in beta; APIs may change.

`@typed/async-data` provides a typed model for async data state: **NoData**, **Loading**, **Success**, **Failure**, and **Optimistic** (plus **Refreshing** as Success/Failure with progress). It integrates with Effect Schema for codecs and offers pattern matching and transformers (map, flatMap, mapError). Use it for UI state that represents remote data, loading indicators, and optimistic updates.

## Dependencies

- `effect`

## API overview

- **Type:** `AsyncData<A, E>` — union of NoData | Loading | Success\<A\> | Failure\<E\> | Optimistic\<A, E\>.
- **Schema:** `AsyncData(A, E)` — builds an Effect Schema codec for `AsyncData` given value and error schemas.
- **Constructors:** `NoData`, `loading(progress?)`, `success(value, progress?)`, `failure(cause, progress?)`, `optimistic(previous, value)`.
- **Guards:** `isNoData`, `isLoading`, `isSuccess`, `isFailure`, `isOptimistic`, `isPending`, `isRefreshing`, `isAsyncData`.
- **Pattern matching:** `match(data, { NoData, Loading, Success, Failure, Optimistic })`.
- **Helpers:** `startLoading`, `stopLoading`; `getSuccess`, `getCause`, `getError`.
- **Transformers:** `map`, `flatMap`, `mapError`; `fromExit`, `fromResult`.

## Example

```ts
import { Option } from "effect";
import * as AsyncData from "@typed/async-data";

// Success and match
const data = AsyncData.success({ id: 1, name: "Alice" });
const message = AsyncData.match(data, {
  NoData: () => "no data",
  Loading: () => "loading...",
  Failure: (cause) => `error: ${cause}`,
  Success: (user) => `user: ${user.name}`,
  Optimistic: (user) => `optimistic: ${user.name}`,
});
// message === "user: Alice"

// From Result and getSuccess
const result = { _tag: "Success" as const, success: { id: 2, name: "Bob" } };
const data2 = AsyncData.fromResult(result);
const name = AsyncData.getSuccess(data2).pipe(
  Option.map((u) => u.name),
  Option.getOrElse(() => "unknown"),
);
// name === "Bob"
```
