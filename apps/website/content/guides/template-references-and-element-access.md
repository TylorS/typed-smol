---
title: "Reference the native element"
summary: "Use ref for the small set of browser integrations that need the exact element, with an Effect-owned lifetime and explicit hydration behavior."
section: "Templates"
kind: "guide"
order: 3.35
---

`ref=${handler}` is the escape hatch for a browser API that needs the native element itself. It is
not a component instance, a mutable ref object, or a general-purpose post-mount hook. The handler
receives the exact `HTMLElement | SVGElement` created for that template instance. Annotate a
narrower element type when the markup makes that safe.

Use attributes, properties, classes, data, and event parts for their ordinary jobs. Reach for `ref`
when an API accepts an element: an observer, a custom-element method, imperative focus management
coordinated by the mounting application, or a browser integration with its own lifecycle.

## Capture an element without a component wrapper

The handler is called while the renderer prepares or adopts the element. For a newly rendered
template, that happens before the outer `render()` consumer inserts its emitted output into a root;
do not treat it as an "after paint" callback. A plain `void` return only captures or configures the
element. It does not create cleanup work.

```ts
import { html } from "@typed/template";

const configureSearch = (element: HTMLInputElement) => {
  element.autocomplete = "off";
  element.setAttribute("aria-keyshortcuts", "Meta+K");
};

export const search = html`<input
  ref=${configureSearch}
  type="search"
  aria-label="Search documentation"
/>`;
```

Typed invokes `configureSearch` once for this concrete template instance. Updating a sibling text,
attribute, or property part does not call it again. If a parent replaces this whole template instance,
the new element has its own ref setup. Keyed collection moves preserve the retained child instance and
its native element; a removed key closes that child scope.

Only a function (or `null` / `undefined` to do nothing) is valid in a direct ref part. Passing a
string, object, or DOM node as `ref` is a runtime error. A function may return `void`, an `Effect`,
an `Fx`, or an Effect `Stream`; a returned cleanup function is merely a plain value and is not a
cleanup protocol.

## Let the rendering Scope own an external resource

Return a scoped Effect when the browser integration acquires a resource. `Effect.acquireRelease`
registers its finalizer with the template's rendering Scope, so the Effect may complete after the
observer is installed. Cleanup runs when that Scope closes—when its containing output is interrupted
or removed—not when the callback returns.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";

const reportWidth = (element: HTMLElement) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const observer = new ResizeObserver(([entry]) => {
        element.style.setProperty("--measured-width", `${entry.contentRect.width}px`);
      });
      observer.observe(element);
      return observer;
    }),
    (observer) => Effect.sync(() => observer.disconnect()),
  );

export const measuredPanel = html`<section ref=${reportWidth}>Content</section>`;
```

The effect's expected error and service channels become part of the template's own `E` and `R`
types. An `Fx` return follows the same ownership rule: its emissions are drained, and its
subscription is interrupted with the rendering Scope. Keep output mutations declarative when there
is a named template part; this pattern is for an API, such as `ResizeObserver`, that has no attribute
or property equivalent.

The same directive can live in a properties spread: `...${{ ref: reportWidth }}`. That is useful for
a reusable property record, but it is not a second ref system. If a reactive spread later removes its
`ref` key, Typed closes the resource owned by that ref before dropping the key.

## Hydrate state through the element that carries it

`RefSubject.hydrate` returns state that is also a callable `HydrationRef`. Passing it to `ref` gives
the HTML renderer a designated attribute host for serialized state and lets the DOM renderer restore
that state from the exact server-rendered element. The state is still normal renderer-independent
state; `ref` only names its DOM handoff point.

```ts
import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";

export const counter = Effect.fn("counter")(function* () {
  const count = yield* RefSubject.hydrate(Schema.Finite, 0);

  return html`<button ref=${count} onclick=${RefSubject.increment(count)}>
    ${count}
  </button>`;
});
```

For interactive HTML, the ref contributes the encoded hydration attributes. During client hydration,
Typed invokes the `HydrationRef` before ordinary reactive parts begin, decodes the server value, and
removes the consumed unnamed hydration envelope. It adopts the exact server-rendered element when
the template markers match, so native identity and browser state are retained rather than replaced.
If no compatible server output exists, normal DOM rendering creates a fresh element and runs the same
ref setup there.

An ordinary callback ref has no HTML representation: server rendering neither calls it nor emits a
marker for it. `StaticHtmlRenderTemplate` deliberately omits hydration metadata as well. That makes
the server/client boundary visible in the value you choose rather than pretending a DOM callback can
run on the server.

## Compose one hydration boundary when state shares a host

Use `hydrateAll` when several hydrated refs should share one host. Unnamed members use one versioned
envelope; named members use their own `data-*` attributes. Each member retains its Schema errors and
codec service requirements, and duplicate named attributes are rejected immediately as a configuration
mistake.

```ts
import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";

export const preferences = Effect.fn("preferences")(function* () {
  const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" });
  const density = yield* RefSubject.hydrate(Schema.String, "comfortable");
  const state = RefSubject.hydrateAll(page, density);

  return html`<section ref=${state}>
    <p>Page ${page}</p>
    <p>Density ${density}</p>
  </section>`;
});
```

`HydrationRef` is a public protocol, but application code normally constructs it with
`RefSubject.hydrate` and combines it with `hydrateAll`; do not hand-build its symbol metadata. Read
[Hydrating Typed HTML](/explore/hydrating-typed-html) for the full request-to-browser flow and
[DOM parts and attributes](/explore/dom-parts-and-attributes) for the directive choice and cost model.
