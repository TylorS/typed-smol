---
slug: react
title: "Use React and Typed together"
summary: "Stream React HTML through Typed, hydrate its range, and render Typed inside React."
---

Keep a mature React account panel while moving its surrounding navigation to Typed. The boundary is the account panel's host, not every button inside it. Keep React context providers and React state inside that root; pass application data across as serializable props on the server and explicit values or callbacks in the browser. A React element is not a Typed renderable—run it through the React renderer first.

## React HTML output inside Typed

`renderToReadableStream` produces React-owned, correctly serialized HTML. Convert the Web Stream
to an Effect `Stream`, lift it to `Fx`, and carry each decoded chunk as an `HtmlRenderEvent`.

```tsx
import { Data, Effect, Stream } from "effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";

class ReactRenderError extends Data.TaggedError("ReactRenderError")<{
  readonly cause: unknown;
}> {}

const renderReact = Effect.fn("renderReact")((view: ReactNode) =>
  Effect.tryPromise({
    try: (signal) => renderToReadableStream(view, { signal }),
    catch: (cause) => new ReactRenderError({ cause }),
  }),
);

const ReactHtml = component(function* (view: ReactNode) {
  const stream = yield* renderReact(view);

  return Fx.fromStream(
    Stream.fromReadableStream({
      evaluate: () => stream,
      onError: (cause) => new ReactRenderError({ cause }),
    }).pipe(Stream.decodeText),
  ).pipe(
    Fx.map((html) => HtmlRenderEvent(html, false)),
    Fx.append(HtmlRenderEvent("", true)),
  );
});

const Profile = () => (
  <section>
    <h2>Ada’s account</h2>
    <label>Display name <input defaultValue="Ada" /></label>
  </section>
);

const page = html`
  <main>
    <div id="react-profile">${ReactHtml(<Profile />)}</div>
  </main>
`;
```

React owns serialization, so Typed treats the chunks as trusted renderer output and keeps their
order. The empty final event marks completion without buffering React's previous chunk merely to
change its `last` flag. React can therefore reveal Suspense boundaries as their HTML arrives.

[React's streaming server documentation](https://react.dev/reference/react-dom/server/renderToReadableStream)
covers shell readiness, Suspense, abort signals, and recoverable server errors. In Node-specific
servers, React recommends `renderToPipeableStream`; adapt that Node stream into an Effect `Stream`
at the same boundary.

## Reconnect the account panel in the browser

Typed owns the `#react-profile` host. React owns its descendants. Hydrate that host with the same
component tree and props used by the server render.

```tsx
import { hydrateRoot } from "react-dom/client";

const Profile = () => (
  <section>
    <h2>Ada’s account</h2>
    <label>Display name <input defaultValue="Ada" /></label>
  </section>
);

const host = document.getElementById("react-profile");
const root = host === null ? undefined : hydrateRoot(host, <Profile />, {
  onRecoverableError: (error) => console.error("Account hydration failed", error),
});
export const removeAccountPanel = () => root?.unmount();
```

## Mount browser-only React output inside Typed

If the panel has no server markup, use `createRoot` instead of `hydrateRoot`. Acquire one root for the component lifetime, update it with each incoming React tree, and return the same host each time. This preserves React's local input state across prop changes. The Typed button below marks the account as reviewed while React keeps the editable display name mounted. This is local review state; persistence belongs to your application workflow.

```tsx
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import { liftRenderableToFx } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import { Button } from "@typed/ui/Button";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

const ReactPanel = component(function* <E, R>(views: Renderable<ReactNode, E, R>) {
  const host = document.createElement("div");
  const root = yield* Effect.acquireRelease(
    Effect.sync(() => createRoot(host)),
    (root) => Effect.sync(() => root.unmount()),
  );
  return Fx.concat(
    liftRenderableToFx<E, R>(views).pipe(Fx.mapEffect((view) => Effect.sync(() => {
      root.render(view);
      return DomRenderEvent(host);
    }))),
    Fx.never,
  );
});

const Account = ({ reviewed }: { readonly reviewed: boolean }) => <section>
  <label>Display name <input defaultValue="Ada" /></label>
  <p>{reviewed ? "Reviewed" : "Needs review"}</p>
</section>;
export const accountPage = component(function* () {
  const reviewed = yield* RefSubject.make(false);
  const views = RefSubject.map(reviewed, (value) => <Account reviewed={value} />);
  return html`<main>
    ${ReactPanel(views)}
    ${Button({ content: "Mark reviewed", onclick: RefSubject.set(reviewed, true) })}
  </main>`;
});
```

A finite props source need not mean the panel should disappear. `Fx.never` keeps the acquired root alive until the parent ends its Scope. The adapter keeps input errors and service requirements; React render errors are a separate React error-boundary concern. `root.render` schedules React work, so await React's test/rendering boundary before asserting committed DOM. See [React createRoot](https://react.dev/reference/react-dom/client/createRoot).

## Typed output inside React

The reverse boundary is useful when a React application wants one Typed feature, such as a live save-status display. React owns the empty host; Typed owns the status subscription and descendants. The `TypedSlot` below intentionally replaces its subscription when `value` identity changes. Pass a stable live renderable for ordinary updates so that a React render does not recreate Typed-local state.

Create one application-owned `ManagedRuntime` from `DomRenderTemplate`. A React slot starts one
scoped Typed render and interrupts that fiber when the slot unmounts. Dispose the runtime only when
the browser application stops.

```tsx
import { Effect, Fiber, ManagedRuntime } from "effect";
import type * as Scope from "effect/Scope";
import * as Fx from "@typed/fx/Fx";
import { html, type Renderable } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import { useEffect, useRef } from "react";

const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));

export const disposeBrowserApplication = (): Promise<void> => runtime.dispose();

export const TypedSlot = ({
  value,
}: {
  readonly value: Renderable<unknown, never, RenderTemplate | Scope.Scope>;
}) => {
  const host = useRef<HTMLDivElement>(null);
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    const element = host.current;
    if (element === null) return;
    let cancelled = false;
    let fiber: Fiber.Fiber<void, never> | undefined;
    const started = pending.current.then(() => {
      if (!cancelled) fiber = runtime.runFork(Effect.scoped(Fx.drain(render(value, element))));
    });
    pending.current = started;
    return () => {
      cancelled = true;
      pending.current = started.then(async () => {
        if (fiber !== undefined) await runtime.runPromise(Fiber.interrupt(fiber));
      });
    };
  }, [value]);

  return <div ref={host} />;
};

const latest = Fx.fromIterable(["Saving account…", "Account saved"]);
const liveProfile = html`<output aria-live="polite">${latest}</output>`;
const page = <TypedSlot value={liveProfile} />;
```

React owns the outer `div`; Typed owns its children for the lifetime of the slot. Do not render React children into that same host. The promise chain serializes lifetime transitions only; it does not wrap each status update or force React to render each Typed value.

## Prove updates preserve the edited account

React runs an extra setup/cleanup cycle in development Strict Mode. Test mounting, unmounting, and mounting the slot again; there should be one active Typed subscription and no callbacks from the removed slot. React does not await effect cleanup. The slot therefore chains replacement through `pending`, waits for the previous fiber interruption, and skips a queued mount if its effect was already cleaned up. This matters when asynchronous Typed finalizers still touch the host. See [React effect cleanup](https://react.dev/reference/react/useEffect).

For SSR, use identical initial props in `hydrateRoot` and the server renderer. Pass React's `onRecoverableError` option to your reporting boundary, and test a deliberately mismatched server/client prop so that diagnostics are observable. Keep React's returned root and unmount it before permanently discarding its host. A server error before the shell and a recoverable Suspense error after the shell are different reporting cases; review [React streaming errors and cancellation](https://react.dev/reference/react-dom/server/renderToReadableStream).

A useful browser regression edits an input in the React panel, updates Typed navigation, and checks that the same input retains its value and selection. Then remove the panel and assert that its subscriptions stop. For prerequisites, read [components](/explore/building-ui-components) and [server rendering and hydration](/explore/server-rendering-and-hydration).
