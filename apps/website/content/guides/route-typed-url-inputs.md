---
title: Route: typed URL inputs
summary: Define the URL shapes an application accepts and decode them before page code runs.
section: Applications
kind: guide
order: 6.7
---

When an issue screen accepts `/issues/42?tab=activity`, it should not hand every page an unchecked
`string` and ask it to parse again. A `Route` owns that URL contract: its pattern, normalized path,
and path/query codecs. It does not observe history or render a page.

```ts
import { Parse, type Route } from "@typed/router/Route";

const Issue = Parse("/issues/:id?tab=:tab?");
const Search = Parse("/search?q=:query&sort=recent");

type IssueParams = Route.Type<typeof Issue>;
// { readonly id: string; readonly tab?: string | undefined }
```

`Issue` accepts `/issues/42` and `/issues/42?tab=activity`. `Search` accepts
`/search?q=typed&sort=recent`, not `sort=popular`: a literal query value is a constraint, not a
default. Declared query values are scalar, so `?tab=a&tab=b` fails decoding; undeclared keys are
ignored.

Use `Int("id")`, `Number("id")`, or `ParamWithSchema("id", schema)` when the handler needs a
domain value. `/:id(\\d+)` constrains a segment; `/:id?` makes it optional. A question mark
normally starts the query, so `/:id?tab=:tab` has a required `id`; use `/:id??tab=:tab` for an
optional terminal id followed by a query.

Malformed schema input becomes `RouteDecodeError` before the handler runs. Next, give this Route to
a [Matcher and Navigation provider](/explore/router-navigation-live-selection).

See [Route](/reference/%40typed%2Frouter%23Route), [Parse](/reference/%40typed%2Frouter%23Parse), and [Int](/reference/%40typed%2Frouter%23Int).
