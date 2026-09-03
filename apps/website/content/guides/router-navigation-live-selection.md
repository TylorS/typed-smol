---
title: "Router: live route selection"
summary: Match typed Routes to values, Effects, Streams, or Fx with local guards, services, layouts, and recovery.
section: Applications
kind: guide
order: 6.8
---

A `Matcher` turns the current URL into live application output. It is both a route table and an
`Fx`: changing the URL selects new work, interrupts work that no longer owns the route, and emits
the selected result.

Nothing in that contract assumes a renderer. A handler can produce application data, an HTTP
response, a DOM render event, HTML, or output owned by another UI library.

## The public Matcher surface

| Task                                 | API                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Start one route table                | `Matcher.empty.match(route, handler)` or `Matcher.match(route, handler)`                     |
| Add a candidate                      | `matcher.match(route, handler)`, `matcher.match(route, guard, handler)`, or the options form |
| Mount a route table below a path     | `matcher.prefix(route)`                                                                      |
| Combine independent route tables     | `matcher.merge(other)` or `Matcher.merge(first, second)`                                     |
| Provide acquired services            | `matcher.provide(layerA, layerB)`                                                            |
| Provide one existing service         | `matcher.provideService(Tag, service)`                                                       |
| Provide an existing Context          | `matcher.provideContext(context)`                                                            |
| Wrap every selected result           | `matcher.layout(layout)`                                                                     |
| Recover typed failures               | `matcher.catch`, `matcher.catchTag`, or `Matcher.catch*`                                     |
| Recover defects and interruption too | `matcher.catchCause` or `Matcher.catchCause`                                                 |
| Redirect only when no route matched  | `Matcher.redirectTo(path)`                                                                   |

The fluent methods keep a route table configurable. The standalone `Matcher.catch`,
`Matcher.catchTag`, `Matcher.catchCause`, and `Matcher.redirectTo` functions accept any Matcher or
Fx, so they are useful once route construction is finished.

## Match the output you already have

The right side of `.match` accepts a plain value, an Effect, a Stream, an Fx, or a function of the
decoded parameters. Typed normalizes those forms without erasing their error or service channels.

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const routes = Matcher.empty
  .match(Route.Parse("/health"), { status: "ok" } as const)
  .match(Route.Parse("/profile"), Effect.succeed({ name: "Ada" }))
  .match(Route.Parse("/audit"), Stream.fromIterable(["opened", "saved"]))
  .match(Route.Parse("/clock"), Fx.fromIterable([1, 2, 3]));
```

A value emits once. An Effect runs once when its route is selected. A Stream or Fx may continue to
emit until navigation selects different work or the consumer stops the Matcher.

`.match` has four useful shapes:

| Shape                                                            | Use it when                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `Matcher.match(route, handler)`                                  | This is the first route and no empty value is needed.          |
| `matcher.match(route, handler)`                                  | Decoding alone decides whether the handler is eligible.        |
| `matcher.match(route, guard, handler)`                           | Selection also needs an effectful Guard.                       |
| `matcher.match(route, { handler, dependencies, layout, catch })` | One candidate owns services, a layout, or a recovery boundary. |

The guard form also accepts the options object, and the full object form accepts `route` beside the
same handler options.

## Keep parameters live while the route stays selected

A function handler receives a `RefSubject` containing the decoded Route value. The handler is
created once for a selected route; navigating from `/issues/41` to `/issues/42` updates that
RefSubject instead of remounting the same handler.

```ts
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const Issue = Route.Parse("/issues/:issueId?tab=:tab?");

const pages = Matcher.match(Issue, (params) =>
  Fx.map(params, ({ issueId, tab }) => ({
    issueId,
    tab: tab ?? "overview",
  })),
);
```

Use the RefSubject directly when the result can update in place. If a parameter change must replace
in-flight work, transform it with the appropriate Fx concurrency operator, such as `switchMap` for
a stale request that should be interrupted.

## Know which candidate wins

Typed compiles Route paths into Effect's native `unstable/http/FindMyWay` matcher, the same routing
engine behind `HttpRouter`. `HttpRouter` uses it to select an HTTP handler;
Matcher uses it to select live Fx work from Navigation, then applies Route codecs and Guards.
Matching is case-insensitive and ignores a trailing slash. Distinct path shapes use the router's
structural precedence, so a literal such as `/issues/new` wins over `/issues/:issueId`.

Registration order matters when candidates compile to the same path shape. Typed tries them in
order:

1. Decode path and query values with the Route schemas.
2. Acquire that candidate's local dependencies.
3. Run its Guard, when present.
4. Select the first candidate whose Guard returns `Some`.

A decode failure, Guard `None`, or Guard failure moves to the next same-shape candidate. If none
succeeds, the Matcher reports `RouteDecodeError` or `RouteGuardError`; if no path shape matched, it
reports `RouteNotFound`.

## Use Guards for effectful selection

A Guard returns an Effect of `Option`. `Some` selects the candidate and may decode, narrow, or enrich
the parameters. `None` is an ordinary non-match. A typed failure remains a failure and is retained if
no later candidate succeeds.

```ts
import { Context, Effect, Option, Schema } from "effect";
import { Fx } from "@typed/fx";
import * as Guard from "@typed/guard";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const Search = Route.Parse("/search?q=:q&page=:page");
const SearchParams = Schema.Struct({
  q: Schema.String,
  page: Schema.FiniteFromString,
});

const decodeSearch = Guard.fromSchemaDecode(SearchParams);

const search = Matcher.match(Search, decodeSearch, (params) =>
  Fx.map(params, ({ q, page }) => ({ q, page })),
);

const Account = Route.Parse("/account");
type AccountParams = Route.Type<typeof Account>;

class Session extends Context.Service<
  Session,
  {
    readonly signedIn: boolean;
  }
>()("example/Session") {}

const requireSession = Effect.fn("requireSession")(function* (params: AccountParams) {
  const session = yield* Session;
  return session.signedIn ? Option.some(params) : Option.none();
});

const account = Matcher.empty
  .match(Account, requireSession, "account")
  .match(Account, "sign in")
  .provideService(Session, { signedIn: true });
```

`decodeSearch` changes `page` from a URL string to a finite number before the handler sees it. The
account Guard reads an Effect service. The second account candidate is a deliberate fallback, not an
error handler. Guard transformation, `None`, and typed failure remain distinct.

The complete [`@typed/guard` vocabulary](/reference/modules/%40typed%2Fguard) is available here:
predicate lifting, Schema decode/encode, composition, effectful mapping, filtering, tagged recovery,
and service provision all retain their output, error, and requirement types in the Matcher.

## Put services next to the routes that use them

Use `.provide`, `.provideService`, or `.provideContext` when a whole route table shares a service.
For one route, pass `dependencies` in its options. A local Layer is acquired before its Guard and
handler; a rejected candidate is rolled back, while the selected candidate keeps the Layer until
that route is replaced.

```ts
import { Context, Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const Issue = Route.Parse("/issues/:issueId");
type IssueParams = Route.Type<typeof Issue>;

class Issues extends Context.Service<
  Issues,
  {
    readonly find: (issueId: string) => Effect.Effect<string>;
  }
>()("example/Issues") {}

const IssuesLive = Layer.succeed(Issues, {
  find: (issueId) => Effect.succeed(`Issue ${issueId}`),
});

const loadIssue = Effect.fn("loadIssue")(function* ({ issueId }: IssueParams) {
  const issues = yield* Issues;
  return yield* issues.find(issueId);
});

const pages = Matcher.match(Issue, {
  dependencies: [IssuesLive],
  handler: (params) => Fx.mapEffect(params, loadIssue),
  layout: ({ content }) => Fx.map(content, (body) => ({ section: "issues", body }) as const),
});
```

The layout wraps route output; it does not render by itself. Both `content` and `params` are live.
Multiple `.layout` calls nest from the route outward, and stable layouts stay mounted when only the
parameters or inner route change.

Choose service placement by ownership:

| API                                  | Lifetime and scope                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `dependencies: [layer]`              | Only this candidate; rolled back when decoding or its Guard rejects.                          |
| `matcher.provide(layerA, layerB)`    | Every case already inside this Matcher. Layers are acquired and finalized with selected work. |
| `matcher.provideService(Tag, value)` | One already-constructed service value, retained by the Matcher.                               |
| `matcher.provideContext(context)`    | Several already-constructed services, still owned by their original creator.                  |

```ts
import { Context, Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

class Catalog extends Context.Service<
  Catalog,
  {
    readonly title: (id: string) => Effect.Effect<string>;
  }
>()("example/Catalog") {}

class Features extends Context.Service<
  Features,
  {
    readonly previews: boolean;
  }
>()("example/Features") {}

class RequestMetadata extends Context.Service<
  RequestMetadata,
  {
    readonly requestId: string;
  }
>()("example/RequestMetadata") {}

const CatalogLive = Layer.succeed(Catalog, {
  title: (id) => Effect.succeed(`Product ${id}`),
});

const loadProduct = Effect.fn("loadProduct")(function* (id: string) {
  const catalog = yield* Catalog;
  const features = yield* Features;
  const request = yield* RequestMetadata;

  return {
    title: yield* catalog.title(id),
    previews: features.previews,
    requestId: request.requestId,
  };
});

const Product = Route.Parse("/products/:id");

const products = Matcher.match(Product, (params) =>
  Fx.mapEffect(params, ({ id }) => loadProduct(id)),
)
  .provide(CatalogLive)
  .provideService(Features, { previews: true })
  .provideContext(Context.make(RequestMetadata, { requestId: "request-42" }));
```

`provide*` changes the Matcher's service channel; it does not start navigation or acquire a Layer
while the route table is being assembled.

## Compose layouts without coupling them to rendering

The `layout` option belongs to one route candidate. `.layout(...)` wraps the whole Matcher built so
far. Both receive live `params` and `content`, and both can return any Fx output.

```ts
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const pages = Matcher.match(Route.Parse("/reports/:reportId"), {
  handler: (params) => Fx.map(params, ({ reportId }) => `Report ${reportId}`),
  layout: ({ content }) => Fx.map(content, (body) => ({ section: "reports", body }) as const),
})
  .layout(({ content }) => Fx.map(content, (page) => ({ navigation: "primary", page }) as const))
  .layout(({ content }) =>
    Fx.map(content, (application) => ({ product: "Typed", application }) as const),
  );
```

The emitted structure is `outer(inner(routeLayout(handler)))`. Stable function identities let the
router update `params` and inner `content` without rebuilding the retained outer layers.

## Recover where the failure has meaning

Matcher failures remain typed. Use `.catchTag` for one tagged failure, `.catch` for the typed error
channel, or `.catchCause` when a boundary must distinguish failure, defect, and interruption.

```ts
import { Data } from "effect";
import { Fx } from "@typed/fx";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

class IssueUnavailable extends Data.TaggedError("IssueUnavailable")<{
  readonly issueId: string;
}> {}

const pages = Matcher.match(
  Route.Parse("/issues/:issueId"),
  Fx.fail(new IssueUnavailable({ issueId: "42" })),
);

const fluentRecovery = pages.catchTag("IssueUnavailable", ({ issueId }) =>
  Fx.succeed({ kind: "offline", issueId } as const),
);

const application = pages.pipe(
  Matcher.catchTag("IssueUnavailable", ({ issueId }) =>
    Fx.succeed({ kind: "offline", issueId } as const),
  ),
  Matcher.redirectTo("/not-found"),
);
```

Route options also accept a local `catch` boundary when recovery belongs to one candidate. That
handler receives the live `Cause` as a RefSubject, so a long-lived fallback can update if the active
failure changes.

Use the fluent `.catch`, `.catchTag`, or `.catchCause` while the result still needs more Matcher
configuration. Use `Matcher.catch`, `Matcher.catchTag`, or `Matcher.catchCause` as data-first or
data-last Fx combinators at the application boundary. `Matcher.redirectTo` handles only
`RouteNotFound`: it does not hide handler, decode, or Guard failures.

## Assemble route tables by application boundary

`prefix` mounts every case below a Route fragment. `merge` combines independently authored Matchers
without stripping their local providers, layouts, or catches.

```ts
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const publicPages = Matcher.empty
  .match(Route.Parse("/"), "home")
  .match(Route.Parse("/pricing"), "pricing");

const administration = Matcher.empty
  .match(Route.Parse("/users"), "manage users")
  .match(Route.Parse("/settings"), "admin settings")
  .prefix(Route.Parse("/admin"));

const application = Matcher.merge(publicPages, administration);
```

## Mount an independently-owned nested router

There is one Navigation provider, not a second history for each child application. Nested routing is
composition: use `prefix` when a route table simply belongs below a known URL, or provide
`CurrentRoute.extend` when an independently-owned Matcher needs a real mount boundary and parent
tree.

Every Matcher reads `CurrentRoute` when it runs and prefixes its cases with that route. The child
therefore writes paths relative to its mount point; it does not repeat `/admin` through every route.

```ts
import { Fx } from "@typed/fx";
import { CurrentRoute } from "@typed/router/CurrentRoute";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";

const administration = Matcher.empty
  .match(Route.Slash, "admin home")
  .match(Route.Parse("users"), "manage users")
  .match(Route.Parse("settings"), "admin settings");

const mountedAdministration = administration.pipe(
  Fx.provide(CurrentRoute.extend(Route.Parse("/admin"))),
);
```

`mountedAdministration` matches `/admin`, `/admin/users`, and `/admin/settings`. Within its
handlers or layouts, `CurrentRoute.route` is `/admin` and `CurrentRoute.parent` preserves the
surrounding structural ancestry. `extend` takes the exact route for this mount; compose a complete
route explicitly when a child is mounted below another child. Use `Navigation.currentEntry` for the
changing URL; `CurrentRoute` describes structure and ownership, not the current parameters.

The same boundary works for an embedded subsystem, a page migrated from another UI library, or an
HTTP adapter mounted below an existing Typed route. Its local guards, layers, layouts, and catches
stay local, while navigation remains shared.

This is also the seam for incremental migrations. One route may emit React-owned DOM, another may
emit a Typed component, and a third may produce an HTTP response. The router only composes Effect
and Fx channels.

## Choose navigation at the edge

The Matcher requires the same `Router` service everywhere; a Layer chooses how locations are
stored and changed.

| Runtime                                   | Layer                    |
| ----------------------------------------- | ------------------------ |
| Browser History and `popstate`            | `BrowserRouter(window?)` |
| SSR, HTTP, or another non-browser request | `ServerRouter({ url })`  |
| Deterministic tests                       | `TestRouter({ url })`    |

```ts
import { Effect } from "effect";
import { Navigation } from "@typed/navigation";
import { TestRouter } from "@typed/router/Router";

const inspectNavigation = Effect.fn("inspectNavigation")(function* () {
  yield* Navigation.navigate("/issues/42?tab=activity", { history: "push" });
  const currentEntry = yield* Navigation.currentEntry;

  return {
    pathname: currentEntry.url.pathname,
    search: currentEntry.url.search,
  };
});

const testProgram = inspectNavigation().pipe(
  Effect.provide(TestRouter({ url: "http://test.local/" })),
);
```

`Navigation.currentEntry` is the committed live history entry. `CurrentRoute` is different: it is
the stable nested mount tree the Matcher uses to own selected handlers, layouts, hooks, and child
Scopes.

For navigation as an Effect service—including history traversal, transitions, pre-commit guards, and
unsaved-work blocking—read [Navigation: history as an Effect service](/explore/navigation-as-an-effect-service).

Continue with [Navigation: history as an Effect service](/explore/navigation-as-an-effect-service),
[Effect HTTP integration](/explore/integrating-matcher-with-effect-http) for server routes, and the
[Matcher reference](/reference/modules/%40typed%2Frouter%2FMatcher) for every public overload.
The router's service, error, and lifetime channels follow [Effect v4](https://www.effect.website/docs/v4).
