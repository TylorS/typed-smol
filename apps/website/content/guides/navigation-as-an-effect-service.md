---
title: "Navigation: history as an Effect service"
summary: Read, change, guard, and test history without coupling application behavior to a renderer.
section: Applications
kind: guide
order: 6.85
---

`Navigation` is the application-facing history service. A Matcher consumes it to select route work,
but Navigation is useful without a Matcher: a command palette can navigate, a form can prevent leaving
with unsaved changes, and an analytics service can react after a destination commits.

`BrowserRouter`, `ServerRouter`, and `TestRouter` provide the same Navigation contract. Browser
history, SSR memory, and deterministic tests therefore differ at the boundary, not throughout
application code.

## The Navigation surface

| Need                                    | API                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Read the committed destination          | `Navigation.currentEntry`, `CurrentPath`                                     |
| Read history and traversal availability | `Navigation.entries`, `Navigation.canGoBack`, `Navigation.canGoForward`      |
| Show work before a destination commits  | `Navigation.transition`                                                      |
| Push or replace a URL                   | `Navigation.navigate(url, options)`                                          |
| Traverse retained entries               | `Navigation.back()`, `Navigation.forward()`, `Navigation.traverseTo(key)`    |
| Change only the current entry state     | `Navigation.updateCurrentEntry({ state })`                                   |
| Reload through the active backend       | `Navigation.reload()`                                                        |
| Participate before or after a commit    | `Navigation.onBeforeNavigation(handler)`, `Navigation.onNavigation(handler)` |
| Pause one pending transition            | `useBlockNavigation()`                                                       |

The state members are `RefSubject` views. The commands are Effects. Reading a destination cannot
change history; navigating cannot happen merely because a view rendered.

## Navigate from ordinary Effect code

`Navigation.navigate` returns the committed `Destination`. Its typed result includes the stable
entry `key`, its unique commit `id`, decoded `URL`, and whatever `state` you stored with it.

```ts
import { Effect } from "effect";
import { Navigation } from "@typed/navigation";

const openIssue = Effect.fn("openIssue")(function* (issueId: string) {
  const destination = yield* Navigation.navigate(`/issues/${issueId}`, {
    history: "push",
    state: { openedFrom: "inbox" },
    info: { focus: "title" },
  });

  return destination.url.pathname;
});
```

`state` is retained on the committed history entry. `info` is transition-only metadata for
before/after handlers. `history: "auto"` is the default: same-origin navigation with the same
pathname replaces the entry, so query and hash changes do not grow history. Choose `"push"` or
`"replace"` when the product behavior should be explicit.

## Observe committed and pending navigation separately

`currentEntry` publishes only committed history. `transition` exists only while a proposed
destination is being processed, so pending UI never needs to guess whether the current URL has
already changed.

```ts
import { RefSubject } from "@typed/fx";
import { CurrentPath, Navigation } from "@typed/navigation";

const pathname = RefSubject.map(Navigation.currentEntry, (entry) => entry.url.pathname);
const pathAndSearch = CurrentPath;
const pending = Navigation.transition;

const canGoBack = Navigation.canGoBack;
const canGoForward = Navigation.canGoForward;
const history = Navigation.entries;
```

`CurrentPath` is the reactive `pathname + search` used by Matcher. Read `currentEntry` when code
also needs `hash`, entry identity, persisted state, or the normalized `URL`.

## Traverse history or update only its state

History movement and entry-state changes are different operations. Traversal preserves the target
entry's URL, key, and state; `updateCurrentEntry` keeps the current slot and URL while replacing its
state.

```ts
import { Effect } from "effect";
import { Navigation } from "@typed/navigation";

const reopenPrevious = Effect.fn("reopenPrevious")(function* () {
  const entries = yield* Navigation.entries;
  const previous = entries.at(-2);

  return previous === undefined
    ? yield* Navigation.currentEntry
    : yield* Navigation.traverseTo(previous.key);
});

const rememberDraft = Navigation.updateCurrentEntry({
  state: { draftId: "draft-42" },
});

const refresh = Navigation.reload({ info: { reason: "retry" } });
```

`back` and `forward` are bounded: at either edge they return the current destination without starting
backend work. A push after going back discards the forward branch. `reload` is deliberately separate
because a browser provider may leave the current JavaScript lifetime once the reload commits.

## Register route behavior with Effect

Pre-commit handlers may let a transition continue, redirect it, or cancel it. Post-commit handlers
run only after history and `currentEntry` agree. Both registrations are scoped Effects: register
them in the application or component lifetime that owns the behavior.

```ts
import { Effect, Option } from "effect";
import { Navigation, RedirectError } from "@typed/navigation";

const redirectLegacyAccount = Navigation.onBeforeNavigation((event) =>
  event.to.url.pathname === "/account"
    ? Effect.fail(new RedirectError({ url: "/settings" }))
    : Effect.succeed(Option.none()),
);

const reportCommittedNavigation = Navigation.onNavigation((event) =>
  Effect.succeed(Option.some(Effect.log(`navigated to ${event.destination.url.pathname}`))),
);
```

The first handler runs before a backend mutation, so its redirect never commits `/account`. A handler
can instead fail with `CancelNavigation` to keep the current destination. The second handler cannot
undo a successful commit; use it for work that must observe the committed URL.

## Model unsaved work without putting it in a component

`useBlockNavigation` exposes a renderer-independent `BlockNavigation` state. When a transition is
blocked, the application chooses exactly one Effect: `confirm`, `cancel`, or `redirect`.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { useBlockNavigation } from "@typed/navigation/Blocking";

const makeEditorNavigation = Effect.fn("makeEditorNavigation")(function* () {
  const isDirty = yield* RefSubject.make(false);
  const blocker = yield* useBlockNavigation({
    shouldBlock: () => isDirty,
  });

  return { isDirty, blocker };
});
```

The owner renders or otherwise observes `blocker`. Reading it has no effect; an explicit
`yield* blocker.confirm`, `yield* blocker.cancel`, or `yield* blocker.redirect("/discarded")`
settles the pending transition. Closing the owning Scope unregisters the blocker and cancels any
unsettled transition.

Continue with [Router: live route selection](/explore/router-navigation-live-selection) to turn
Navigation into typed route output, or [test Typed systems](/explore/testing-typed-systems) to run the
same transitions against memory history. See [Navigation](/reference/modules/%40typed%2Fnavigation%2FNavigation),
[Blocking](/reference/modules/%40typed%2Fnavigation%2FBlocking), and
[Effect v4](https://www.effect.website/docs/v4).
