---
title: Delegate browser events from a renderer
summary: Use EventSource when a renderer needs scoped, native delegation across the concrete elements it produced.
section: Integration
kind: deep-dive
order: 10.15
---

`EventSource` is the lower-level event boundary used by a DOM renderer. It is for a renderer,
adapter, or instrumented target that already owns concrete DOM output—not for ordinary template
authors. Application templates should use [Native events with Effect](/explore/native-events-with-effect).

An event source has two separate pieces of state: registrations name a concrete element and event
type; mounts name the rendered roots whose native listeners receive bubbling or captured events.
That distinction lets one renderer keep event wiring local to its output without a document-wide
registry or a second propagation model.

## Register a concrete target in a rendered range

Register the element whose subtree should match, then set up the rendered root in the Scope that
owns that output. An event reaches the handler only when the registered target is the browser event
target or contains it. In practice, register elements contained by the `Rendered` value you pass to
`setup`; a root can be an element, a `Wire`, a fragment-derived range, or several concrete roots.

```ts
import { Effect, Scope } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";

const events = makeEventSource();
const root = document.createElement("section");
const menu = document.createElement("div");
const close = document.createElement("button");
close.textContent = "Close";
menu.append(close);
root.append(menu);

const closeMenu = EventHandler.make(
  Effect.fn("closeMenu")(function* (event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    yield* Effect.sync(() => button.closest("[role=menu]")?.setAttribute("hidden", ""));
  }),
);

events.addEventListener(menu, "click", closeMenu);

export const setupMenuEvents = Effect.fn("setupMenuEvents")(function* () {
  yield* events.setup(root, yield* Scope.Scope);
});
```

The listener is attached to each concrete root, not directly to `menu`. Delegation checks
`menu.contains(event.target)` before it starts the handler, so a sibling elsewhere in `root` does
not accidentally match. The callback receives a forwarding event object: browser properties and
methods are forwarded, methods stay bound to the native event, and `currentTarget` is the registered
`menu`. The forwarding value is not object-identical to the native event; do not use identity as a
cross-boundary protocol.

## Registration can follow mounting

`setup` first and register later when an adapter discovers a capability after it has produced DOM.
The new registration attaches to every active mount immediately. Its returned `Disposable` removes
only that registration from every active mount; it does not dispose the rendered range or any other
handler.

```ts
import { Effect, Scope } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";

const events = makeEventSource();
const root = document.createElement("div");
const target = document.createElement("button");
root.append(target);

export const installLate = Effect.fn("installLate")(function* () {
  yield* events.setup(root, yield* Scope.Scope);

  return events.addEventListener(
    target,
    "click",
    EventHandler.make(() => Effect.log("adapter command invoked")),
  );
});
```

Keep the returned `Disposable` only when the registration itself has a shorter lifetime than the
mount—for example, a feature that can be enabled and disabled while the foreign root stays mounted.
Otherwise register alongside the renderer's part bookkeeping and let that part dispose the entry
when it is replaced.

## Keep browser listener semantics intact

`EventHandler.make` carries native `AddEventListenerOptions` through to each listener attachment.
`capture`, `passive`, and an `AbortSignal` retain their browser meanings. `once` removes this
delegated registration after its first matching event, across its active mounts. A matching rule
matters here: an unrelated click does not consume another element's once handler.

```ts
import { Effect, Scope } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { makeEventSource } from "@typed/template/EventSource";

const events = makeEventSource();
const root = document.createElement("main");
const dismiss = document.createElement("button");
root.append(dismiss);

const controller = new AbortController();
const dismissOnce = EventHandler.make(
  () => Effect.log("dismissed"),
  { capture: true, once: true, signal: controller.signal },
);
const observeWheel = EventHandler.make(
  (event: WheelEvent) => Effect.log(`wheel: ${event.deltaY}`),
  { passive: true },
);

events.addEventListener(dismiss, "click", dismissOnce);
events.addEventListener(root, "wheel", observeWheel);

export const setupNativeOptions = Effect.fn("setupNativeOptions")(function* () {
  yield* events.setup(root, yield* Scope.Scope);
});
```

A passive listener still cannot prevent the default action; that is enforced by the browser. An
aborted `AbortSignal` removes its native attachment, while disposing the registration removes the
entry from the event source as well. Keep those choices explicit in an adapter's public contract.

## Let the mount Scope release the boundary

Each `setup(rendered, scope)` call owns the native attachments made for that mount. Closing its
Scope removes those listeners and interrupts handler Effects that are still running. It does not
silently erase registrations, because the same renderer-local `EventSource` may later set up a new
mount. Conversely, disposing a registration leaves every other registered listener and mount
alone.

That split is useful for renderer authors: the range lifetime is the mount Scope; the entry lifetime
is the renderer part or adapter feature that created it. Test both independently with real DOM
events: an unrelated target must not run a contained handler, a late registration must work on an
existing mount, a once handler must survive unrelated events, and closing the mount Scope must make
later dispatches inert. The package's browser tests cover those same native boundaries.

`EventSource` does not need to be exposed by an application-facing renderer. It is the seam to use
when a renderer needs delegation itself; keep ordinary `onclick=${handler}` authoring on the higher
level [Native events with Effect](/explore/native-events-with-effect) guide.
