---
title: "Mounting DOM output"
summary: "Render a live RenderEvent Fx into one real browser root with an explicit lifetime."
section: "DOM and platform"
kind: "guide"
order: 6.1
---

A page becomes interactive when something runs it. Calling `html` only describes a view;
`render(page, host)` describes where its output belongs. The browser entry point supplies
`DomRenderTemplate` and runs that program for as long as the host is alive.

## Give the application a dedicated slot

Suppose an existing page has a static header and a Typed account panel. Put an `#account-panel`
element beside the header and give that element to `render`. The host is a replacement boundary:
when new nonempty root output arrives, Typed calls `replaceChildren` on the host. Children owned by
another system must live outside that slot.

```ts
import { Effect, Fiber } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const host = document.querySelector<HTMLElement>("#account-panel");
if (host === null) throw new Error("Missing #account-panel mount slot");

const application = Effect.scoped(
  Effect.gen(function* () {
    const expanded = yield* RefSubject.make(false);
    const toggle = RefSubject.update(expanded, (value) => !value);
    const page = html`<section>
      <button type="button" aria-expanded=${expanded} onclick=${toggle}>
        Account details
      </button>
      <p ?hidden=${expanded.pipe(RefSubject.map((value) => !value))}>
        Signed in as Ada
      </p>
    </section>`;

    yield* page.pipe(
      render(host),
      Fx.drain,
      Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
    );
  }),
);

// Browser entry point: retain the fiber in the code that owns the panel.
const fiber = Effect.runFork(application);
export const stopAccountPanel = () => Effect.runPromise(Fiber.interrupt(fiber));
```

The state and the view share one Scope. The handler is an Effect directly because it does not need
the click event. Changing `expanded` updates the captured attribute and boolean part; it does not
emit a new root section or recreate the button.

`Fx.drain` runs the source without collecting its output. A DOM template stays live after its first
output so its listeners and reactive parts remain installed. Interrupting the fiber closes that
work and runs the acquired finalizers. A foreign node carried by `DomRenderEvent` has no automatic
disposer: its producer must supply resource cleanup. If your host requires an empty slot on shutdown,
clear its dedicated children after interruption; do not infer a universal unmount policy from Scope
closure alone.

## Let a larger Effect program own the lifetime

A library should usually return the mount Effect to its caller. Calling `Effect.runFork` inside a
view or adapter would hide its lifetime and error reporting from the application.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

export const mountHelp = (host: HTMLElement) =>
  html`<aside aria-label="Help">Contact support for account assistance.</aside>`.pipe(
    render(host),
    Fx.drain,
    Effect.provide(DomRenderTemplate.using(host.ownerDocument)),
    Effect.scoped,
  );
```

The caller can run this in its own scoped fiber, await its failure, and interrupt it during route or
panel teardown. Supplying `host.ownerDocument` also makes the document dependency explicit for an
iframe or test document. It does not make browser globals used by your own callbacks automatically
refer to that document's window.

`Fx.drainLayer` is useful when rendering is intentionally background work in a Layer graph. It
forks the source and does not propagate that child fiber's eventual failure through Layer
acquisition. Handle or report failures in the source before using it. Prefer the direct `Fx.drain`
Effect when the owner needs to supervise the render's exit.

## Mounting and adopting share one entry point

`render` checks the host for compatible Typed hydration markers. With matching server output it can
adopt existing nodes; without a match it builds fresh DOM. Do not mount the entire server document
into a panel host: render the same inner view the server placed there.

Test the slot boundary with a sibling owned by other code, then test a real state change and a
native click. The sibling should remain the same node; the button should remain the same node
across scalar updates; interrupting the render should make later clicks inert. For compatible SSR,
add the stronger assertion that the first client button is the original server button.

Continue with [Hydrating Typed HTML](/explore/hydrating-typed-html) for adoption and
[Using DomRenderEvent](/explore/dom-render-event) for output produced by a foreign renderer.
The [Render module](/reference/modules/%40typed%2Ftemplate%2FRender) contains the mounting contracts;
Effect's [Scope guide](https://effect.website/docs/v4/resource-management/scope/) explains their
resource lifetime.
