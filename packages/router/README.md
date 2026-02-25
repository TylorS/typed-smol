# @typed/router

> **Beta:** This package is in beta; APIs may change.

## Purpose

`@typed/router` provides **typed routing** for Effect apps: path and query parameters derived from route strings and decoded via Effect Schema, **Route** definitions, **Matcher** (pattern matching on routes), **CurrentRoute**, and **Router** layers. Use it when you need type-safe routing with parsable path/query and composable matchers that produce Fx streams and react to path changes.

## Use cases

- **Typed SPAs** — `BrowserRouter()` + `run(matcher)` for client-side routing; matcher cases yield Fx that switch as the path changes.
- **SSR** — `ServerRouter({ initialMemory })` for server rendering with in-memory navigation.
- **Tests** — `TestRouter()` with deterministic IDs for predictable route tests.
- **File-based routing** — `@typed/app` virtual modules generate Matcher source from route files; use `import { Matcher } from "router:./routes"` with typedVitePlugin or vmc.

## Architecture

1. **Route** — Define paths (`Route.Parse("/todos/:id")`), optionally with query (`?filter=`). Path and query types come from the route string.
2. **Matcher** — Add cases via `match(route, handler)`; each case returns an Fx, Effect, Stream, or value. Nest routes with `prefix(route)`.
3. **run(matcher)** — Compile the matcher and return an Fx that reacts to `CurrentPath` from `Navigation`. When the path changes, the matcher selects the matching case, scopes the previous handler, and yields the new handler's Fx.
4. **Router layers** — Provide `BrowserRouter`, `ServerRouter`, or `TestRouter` to supply `Navigation` and `CurrentRoute`.

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

For file-based routing, see `@typed/app` and its virtual `router:./routes` imports.

## API reference

### Router

| Symbol                   | Description                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `Router`                 | Type: `CurrentRoute` or `Navigation`. The routing service union.                                |
| `BrowserRouter(window?)` | `Layer<Router>`. Provides router using the browser `window` (or global).                        |
| `ServerRouter(options)`  | `Layer<Router>`. Provides router with `memory()` or `initialMemory()` from `@typed/navigation`. |
| `TestRouter(options)`    | `Layer<Router>`. Like `ServerRouter` but with `Ids.Test()` for deterministic IDs.               |

### Route

| Symbol                                              | Description                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Route<P, S>`                                       | Interface: `ast`, `path`, `paramsSchema`, `pathSchema`, `querySchema`. Path/query types come from the path string. |
| `Route.make(ast)`                                   | Build a `Route` from an `AST.RouteAst`.                                                                            |
| `Route.Parse(path)`                                 | Parse a path string (e.g. `"/todos/:id?filter=all"`) into a typed `Route`.                                         |
| `Route.Slash`                                       | Route for `"/"`.                                                                                                   |
| `Route.Wildcard`                                    | Route for `"*"`.                                                                                                   |
| `Route.Param(name)`                                 | Route for `/:name` (string param).                                                                                 |
| `Route.ParamWithSchema(name, schema)`               | Route for `/:name` with an Effect Schema codec.                                                                    |
| `Route.Number(name)`                                | Route for `/:name` decoded as number.                                                                              |
| `Route.Int(name)`                                   | Route for `/:name` decoded as integer.                                                                             |
| `Route.Join(...routes)`                             | Join route segments into one route (path and params combined).                                                     |
| `Route.Path<T>`, `Route.Type<T>`, `Route.Params<T>` | Type helpers for a route’s path string, decoded type, and params.                                                  |

### Matcher

| Symbol                                 | Description                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Matcher<A, E, R>`                     | Interface: pattern match on routes; each case yields an Fx.                                                  |
| `match`                                | Start a matcher (same as `empty.match`).                                                                     |
| `empty`                                | Empty matcher (no cases).                                                                                    |
| `matcher.match(route, handler)`        | Add a case: `route` + handler (function, Fx, Effect, Stream, or value).                                      |
| `matcher.match(route, options)`        | Add a case with `handler`, optional `dependencies`, `layout`, `catch`.                                       |
| `matcher.match(route, guard, handler)` | Add a case with a guard (e.g. from `@typed/guard`) before the handler.                                       |
| `matcher.prefix(route)`                | Nest this matcher under a parent route.                                                                      |
| `matcher.provide(...layers)`           | Provide Effect layers to the matcher.                                                                        |
| `matcher.provideService(tag, service)` | Provide a single service.                                                                                    |
| `matcher.provideServices(services)`    | Provide a service map.                                                                                       |
| `matcher.catchCause(f)`                | Handle failures by cause.                                                                                    |
| `matcher.catch(f)`                     | Handle failures by error value.                                                                              |
| `matcher.catchTag(tag, f)`             | Handle a specific error tag.                                                                                 |
| `matcher.layout(layout)`               | Wrap matcher output in a layout Fx.                                                                          |
| `run(matcher)`                         | Compile the matcher and return an `Fx` that reacts to the current path (requires `Router` + `CurrentRoute`). |
| `catchCause(input, f)`                 | Attach cause-based error handling to an Fx or matcher run.                                                   |
| `catch(input, f)`                      | Attach error-based handling.                                                                                 |
| `catchTag(input, tag, f)`              | Attach tag-based error handling.                                                                             |
| `redirectTo(path)`                     | Returns a function that, given an Fx or matcher, redirects to `path` on failure.                             |

**Matcher types**

| Type                                 | Description                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `Layout<Params, A, E, R, B, E2, R2>` | `(params) => Fx<B, E2, R2>`; wraps content with params and inner Fx.  |
| `CatchHandler<E, A, E2, R2>`         | `(cause: RefSubject<Cause<E>>) => Fx<A, E2, R2>`.                     |
| `MatchHandler<Params, A, E, R>`      | Handler for a route: Fx, Effect, Stream, value, or `(params) => ...`. |

**Errors**

| Class              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `RouteNotFound`    | No route matched the path.                            |
| `RouteDecodeError` | Path/query failed to decode (e.g. schema validation). |
| `RouteGuardError`  | Guard rejected (e.g. auth).                           |

### CurrentRoute

| Symbol                       | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `CurrentRoute`               | Effect Service exposing the current matched route tree.                        |
| `CurrentRouteTree`           | `{ route: Route<string, any>; parent?: CurrentRouteTree }`.                    |
| `CurrentRoute.Default`       | Layer that provides `CurrentRoute` from `Navigation.base`.                     |
| `CurrentRoute.extend(route)` | Layer that provides `CurrentRoute` with a fixed `route` and optional `parent`. |
