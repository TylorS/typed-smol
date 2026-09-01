---
title: Router + Navigation: live selection
summary: Select live output from typed routes and choose browser, server, or test history explicitly.
section: Applications
kind: guide
order: 6.8
---

After defining an issue URL, make it select a page. A `Matcher` is already an `Fx`: it reads the
current Navigation location and replaces route work when that location changes. Its function handler
gets reactive decoded parameters, not a stale snapshot.

```ts
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";

const Issue = Router.Parse("/issues/:id?tab=:tab?");

const pages = Router.empty
  .match(Router.Slash, "all issues")
  .match(Issue, (params) => Fx.map(params, ({ id, tab }) => `issue ${id}: ${tab ?? "overview"}`))
  .match(Router.Wildcard, "not found");
```

There is no separate `run(matcher)` call: render or observe the Matcher Fx. Put narrow alternatives
before generic ones and `Wildcard` last. Decode and guard failures can fall through to the next
same-shape candidate in registration order.

Choose the history implementation at the boundary:

| Need                             | Provider                 |
| -------------------------------- | ------------------------ |
| Browser History and `popstate`   | `BrowserRouter(window?)` |
| A request or non-browser runtime | `ServerRouter({ url })`  |
| Deterministic tests              | `TestRouter({ url })`    |

```ts
import { Effect } from "effect";
import { Navigation } from "@typed/navigation";
import { TestRouter } from "@typed/router/Router";

const testProgram = Effect.gen(function* () {
  yield* Navigation.navigate("/issues/42?tab=activity", { history: "push" });
  const currentEntry = yield* Navigation.currentEntry;
  return currentEntry.url.pathname;
}).pipe(Effect.provide(TestRouter({ url: "http://test.local/" })), Effect.scoped);
```

`Navigation.currentEntry` is the committed live URL. `CurrentRoute` is different: it is the
stable mount tree used for nested route ownership. Navigation actions and scoped before/after hooks
are Effects, so history policy, cancellation, redirects, and cleanup stay explicit.

Use [mounting DOM output](/explore/mounting-dom-output) for a browser target, [HTML rendering](/explore/rendering-html-on-the-server) for serialization, and [Effect HTTP integration](/explore/integrating-matcher-with-effect-http) for server routes.
