# @typed/router

> **Beta:** This package is in beta; APIs may change.

`@typed/router` provides **typed routing**: path and query parameters with Effect Schema, route definitions (**Route**), **Matcher** (pattern matching on routes), **CurrentRoute**, and **Router** (compile, layout/catch managers). Use it for type-safe routing in Effect apps, with parsable path/query and composable matchers that produce Fx streams.

## Dependencies

- `effect`
- `@typed/fx`
- `@typed/guard`
- `@typed/id`
- `@typed/navigation`
- `find-my-way-ts`
- `hkt-core`

## API overview

- **Route** — `make(ast)`, `path`, `paramsSchema`, `pathSchema`, `querySchema`; path/query types are derived from the route path string.
- **Matcher** — cases keyed by route; each case returns an Fx; `prefix(parentRoute)` for nested routes; compile to router entries.
- **CurrentRoute** — service exposing the current matched route tree.
- **Router** — `compile(matcher)`, `makeLayerManager`, `makeCatchManager`, `makeLayoutManager` for building the routing layer.
- **Join**, **Parse** — helpers for path/query construction and parsing.

## Example

Define routes with `Router.Parse` and `Router.match`, then provide `Router.BrowserRouter()` (see the [TodoMVC example](https://github.com/typed-smol/typed-smol/tree/main/examples/todomvc)):

```ts
import * as Router from "@typed/router";

const filterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .pipe(Router.redirectTo("/"));

// Provide Router.BrowserRouter() and use filterState (or other matchers) in your layers
```
