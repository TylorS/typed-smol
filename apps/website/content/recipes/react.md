---
slug: react
title: Use React and Typed together
summary: Stream React HTML through Typed, hydrate its range, and render Typed inside React.
---

React and Typed can share a page as long as each renderer owns a distinct range. On the server,
React already produces an HTML stream; preserve that stream instead of collapsing it into one
string. In the browser, give the same host back to React for hydration.

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
    try: () => renderToReadableStream(view),
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
    <h2>React profile</h2>
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

## Hydrate the React range

Typed owns the `#react-profile` host. React owns its descendants. Hydrate that host with the same
component tree and props used by the server render.

```tsx
import { hydrateRoot } from "react-dom/client";

const Profile = () => (
  <section>
    <h2>React profile</h2>
  </section>
);

const host = document.getElementById("react-profile");
if (host !== null) hydrateRoot(host, <Profile />);
```

## Typed output inside React

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

  useEffect(() => {
    if (host.current === null) return;

    const fiber = runtime.runFork(Effect.scoped(Fx.drain(render(value, host.current))));
    return () => {
      void runtime.runPromise(Fiber.interrupt(fiber));
    };
  }, [value]);

  return <div ref={host} />;
};

const latest = Fx.fromIterable([42, 43]);
const liveProfile = html`<output>TYPED: ${latest}</output>`;
const page = <TypedSlot value={liveProfile} />;
```

React owns the outer `div`; Typed owns its children for the lifetime of the slot. Do not render
React children into that same host.
