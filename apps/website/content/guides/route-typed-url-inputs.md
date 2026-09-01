---
title: "Route: typed URL inputs"
summary: Define path and query contracts as Effect Schema codecs before application code runs.
section: Applications
kind: guide
order: 6.7
---

A `Route` describes one family of URLs. It owns the path grammar, the names exposed to application
code, and the codecs that translate URL strings into domain values. It does not observe history,
run a handler, or render output.

That separation is useful well beyond UI routing. The same Route can validate a browser location,
an HTTP request, a generated link, a test fixture, or an agent-produced URL.

## The public Route surface

| Task | API |
| --- | --- |
| Parse a complete typed pattern | `Route.Parse(pattern)` |
| Match the root or remaining path | `Route.Slash`, `Route.Wildcard` |
| Build a reusable string segment | `Route.Param(name)` |
| Decode a number or integer segment | `Route.Number(name)`, `Route.Int(name)` |
| Decode a segment with any Effect Schema Codec | `Route.ParamWithSchema(name, codec)` |
| Combine reusable Route fragments | `Route.Join(...routes)` |
| Build from the public Route AST | `Route.make(ast)` |
| Read normalized syntax and codecs | `route.path`, `route.pathSchema`, `route.querySchema`, `route.paramsSchema` |
| Extract decoded contracts | `Route.Type`, `Route.PathType`, `Route.QueryType` |
| Type generic route utilities | `Route.Any`, `Route.Params`, and the `Route` type namespace |

Most application routes start with `Parse` or `Join`. `make` is the extension point for libraries
that construct the public [`RouteAst`](/reference/modules/%40typed%2Frouter%2FAST) directly.

## Read the route grammar

`Parse` turns a literal route pattern into a typed value. Parameter names become object keys without
an interface or cast beside the route.

Its path syntax follows [find-my-way-ts](https://github.com/tim-smart/find-my-way-ts), the routing
engine behind Effect's `HttpRouter`. A Route only describes that syntax and its codecs here; the
[Router guide](/explore/router-navigation-live-selection) covers how Matcher uses the same engine to
select application work from a URL.

| Pattern | Meaning | Decoded fields |
| --- | --- | --- |
| `/issues` | literal path | `{}` |
| `/issues/:issueId` | required path parameter | `{ issueId: string }` |
| `/issues/:issueId?` | optional path parameter | `{ issueId?: string }` |
| `/issues/:issueId(\\d+)` | regex-constrained parameter | `{ issueId: string }` |
| `/files/*` | remaining path | `{ "*": string }` |
| `/issues?tab=:tab` | required query value | `{ tab: string }` |
| `/issues?tab=:tab?` | optional query value | `{ tab?: string }` |
| `/issues?view=compact` | literal query constraint | `{}` |

```ts
import * as Route from "@typed/router/Route"

const Issue = Route.Parse("/issues/:issueId?tab=:tab?&view=full")

type IssueParams = Route.Type<typeof Issue>
// { readonly issueId: string; readonly tab?: string | undefined }
```

`Issue` accepts `/issues/42?view=full` and `/issues/42?tab=activity&view=full`. It rejects
`view=compact`: a literal query value is a constraint, not a default.

A `?` after a terminal parameter normally begins the query declaration, so
`/issues/:issueId?tab=:tab` keeps `issueId` required. Use the explicit `??` boundary when the
terminal path parameter is optional: `/issues/:issueId??tab=:tab`.

## Keep path and query decoding separate when it helps

Every Route exposes three Effect Schema codecs:

| Codec | Input it owns |
| --- | --- |
| `pathSchema` | declared path parameters only |
| `querySchema` | declared query parameters only |
| `paramsSchema` | the combined handler input |

```ts
import { Schema } from "effect"
import * as Route from "@typed/router/Route"

const Issue = Route.Parse("/issues/:issueId?tab=:tab?")

const decodePath = Schema.decodeEffect(Issue.pathSchema)
const decodeQuery = Schema.decodeEffect(Issue.querySchema)
const decodeParams = Schema.decodeEffect(Issue.paramsSchema)

const path = decodePath({ issueId: "42" })
const query = decodeQuery({ tab: "activity" })
const params = decodeParams({ issueId: "42", tab: "activity" })
```

These are ordinary Effect Schema decoders. Their parse failures and service requirements remain in
the returned Effect. Tooling can validate path and query data independently, while a Matcher uses
`paramsSchema` before invoking a handler.

Declared query values are scalar. Repeating a declared key, such as
`?tab=activity&tab=history`, fails with `RouteDecodeError` instead of silently selecting one value.
Undeclared query keys are ignored by route decoding.

## Decode path segments into domain values

Use `Int` and `Number` for common numeric parameters. Use `ParamWithSchema` when the decoded value
has a domain-specific Codec.

```ts
import { Effect, Schema } from "effect"
import * as Route from "@typed/router/Route"

const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"))

const Workspace = Route.Join(
  Route.Parse("/workspaces"),
  Route.ParamWithSchema("workspaceId", WorkspaceId),
)

type WorkspaceParams = Route.Type<typeof Workspace>
// { readonly workspaceId: string & Brand<"WorkspaceId"> }

const decodeWorkspace = Schema.decodeEffect(Workspace.paramsSchema)
const encodeWorkspace = Schema.encodeEffect(Workspace.paramsSchema)

const roundTrip = decodeWorkspace({ workspaceId: "typed" }).pipe(
  Effect.flatMap(encodeWorkspace),
)
```

The encoded side remains a URL string. The decoded side is the branded domain value. A Codec may
also require services. The `Route` type namespace preserves those decoding and encoding
requirements for generic link and matching utilities.

`Int("issueId")` similarly decodes `"42"` to `42` and rejects decimals or malformed input.
`Number("value")` accepts finite decimal and exponent forms while rejecting `NaN` and infinity.

## Compose route fragments

`Join` composes reusable route fragments and intersects their decoded parameter records. The
resulting Route still has one normalized path and one combined Codec.

```ts
import * as Route from "@typed/router/Route"

const Organization = Route.Join(
  Route.Parse("/organizations"),
  Route.Param("organizationId"),
)
const Issue = Route.Join(Organization, Route.Parse("/issues"), Route.Int("issueId"))
const SearchPage = Route.Join(Route.Parse("/search"), Route.Number("page"))
const Assets = Route.Join(Route.Parse("/assets"), Route.Wildcard)
const Home = Route.Slash

type IssueParams = Route.Type<typeof Issue>
// { readonly organizationId: string; readonly issueId: number }
```

Route construction rejects duplicate decoded field names. Joining `Param("id")` with `Int("id")`,
or mapping two query keys to the same placeholder name, fails immediately instead of overwriting a
value later.

`Slash`, `Wildcard`, `Param`, `Int`, `Number`, `ParamWithSchema`, `Parse`, and `Join` all produce the
same Route interface. Choose constructors for reusable fragments and `Parse` for a route whose shape
is clearest as one pattern.

## Read a Route's types

The module exports the common decoded helpers directly. The `Route` interface also carries helpers
for the literal pattern, combined Codec, and its service requirements.

```ts
import { Parse, type Route } from "@typed/router/Route"

const Issue = Parse("/issues/:issueId?tab=:tab?")

type Pattern = Route.Path<typeof Issue>
type EncodedParams = Route.Params<typeof Issue>
type DecodedParams = Route.Type<typeof Issue>
type PathParams = Route.PathType<typeof Issue>
type QueryParams = Route.QueryType<typeof Issue>
type ParamsCodec = Route.Schema<typeof Issue>
type DecodeRequirements = Route.DecodingServices<typeof Issue>
type EncodeRequirements = Route.EncodingServices<typeof Issue>
```

These are projections of the Route you already declared; they do not create a second route model.
Most handlers only need `Route.Type`. Library code that generates links or builds Matchers may also
need the Codec and service helpers.

## Build a Route from its AST

`Route.make` exists for routing libraries and code generators that need to construct the same public
model without parsing a string pattern.

```ts
import * as RouteAst from "@typed/router/AST"
import * as Route from "@typed/router/Route"

const Account = Route.make<"/account">(
  RouteAst.path(RouteAst.literal("account")),
)
```

Application code should normally prefer `Route.Parse` and `Route.Join`: they express the URL more
directly while producing the same `Route` interface.

See [Effect v4](https://www.effect.website/docs/v4),
[Route](/reference/modules/%40typed%2Frouter%2FRoute), and the
[Router guide](/explore/router-navigation-live-selection).
