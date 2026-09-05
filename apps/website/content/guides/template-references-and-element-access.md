---
title: "Reference the native element"
summary: "Use ref for the small set of browser integrations that need the exact element, with an Effect-owned lifetime and explicit hydration behavior."
section: "Template bindings"
kind: "guide"
order: 5
---

Most field behavior belongs in attributes, properties, and events. An element reference becomes
necessary when a browser API needs the element object itself—for example, observing a results panel's
size or creating a foreign editor on its host. `ref` attaches that setup to the concrete template
instance and lets Effect own the resource lifetime.

Read [Native events with Effect](/explore/native-events-with-effect) before using a ref merely to
install an event listener. A named event part already expresses that job more precisely.

## Capture the exact element without inventing a component instance

A direct ref accepts a function, or a nullish value to do nothing. The function receives the native
element; this input annotation is safe because the authored tag is an input:

```ts
import { html } from "@typed/template";

const configureSearch = (input: HTMLInputElement) => {
  input.autocomplete = "off";
  input.setAttribute("aria-keyshortcuts", "Meta+K");
};

export const search = html`<input type="search" aria-label="Search articles" ref=${configureSearch} />`;
```

For ordinary declarative fields, prefer writing their template parts directly. This small callback
only shows when and with what object the ref runs. It returns `void`, so it acquires no cleanup work.
Passing a mutable ref-shaped object, string, or DOM node instead of a function is not this protocol
and fails at runtime.

The renderer invokes the ref while preparing fresh output or wiring adopted output. A fresh element
may not yet be inserted into the outer host. Element availability therefore does not imply layout,
paint, focusability, or connection. Do not treat a ref as an after-paint callback.

## Tie an observer to the element's running lifetime

A results panel can report its width through `ResizeObserver`. The browser observer has a resource
lifetime that must end when the view ends:

```ts
import { Effect } from "effect";
import { html } from "@typed/template";

const measurePanel = (element: HTMLElement) => Effect.acquireRelease(
  Effect.sync(() => {
    const observer = new ResizeObserver(([entry]) => {
      element.style.setProperty("--measured-width", `${entry.contentRect.width}px`);
    });
    observer.observe(element);
    return observer;
  }),
  (observer) => Effect.sync(() => observer.disconnect()),
);

export const results = html`<section aria-label="Search results" ref=${measurePanel}>
  Results appear here.
</section>`;
```

The returned Effect installs the observer and registers its finalizer with the rendering scope.
It can finish after acquisition without immediately disconnecting the observer. The observer lives
until that owner closes—for example when a keyed result is removed or the containing render stops.

A ref may also return an Fx or Effect Stream; its emissions are drained and its subscription is
interrupted with that scope. Returning a plain JavaScript cleanup function is not a cleanup protocol.
Use Effect resource management so error and service requirements remain visible to the template.

The style custom property in this example belongs to the observer. Avoid another writer replacing
the same style state. A library requiring a connected host also needs explicit mount coordination;
adding a guessed timeout does not establish connection or layout readiness.

## Distinguish retained elements from replaced capabilities

Changing a sibling text part does not reinstall the ref. A retained keyed child keeps its existing
ref setup when it moves. Removing the child closes its scope. Replacing the whole template creates
a new element and a new setup lifetime.

A spread can contain the same `ref` callback. Removing that key closes the ref's resource even if
the host element remains. This is useful for enabling and disabling a feature with a shorter lifetime
than the panel. [Spread props and data records](/explore/template-spreads-data) explains that per-key
ownership.

## Use hydration refs for state that crosses the response boundary

An ordinary callback cannot run on a server without its browser element and produces no HTML
representation. `RefSubject.hydrate` deliberately adds another capability: its result is both state
and a callable `HydrationRef` that can serialize state on a designated host.

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SearchState = component(function* () {
  const query = yield* RefSubject.hydrate(Schema.String, "scope");
  return html`<section ref=${query}><output>Query: ${query}</output></section>`;
});
```

The HTML target writes the encoded state at this ref host. During adoption the DOM target restores
it before ordinary reactive parts begin and removes the consumed unnamed envelope. The state remains
a RefSubject; the ref identifies its server-to-browser handoff point.

When several refs share an element, combine them with `hydrateAll`:

```ts
import { Schema } from "effect";
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui/Component";
import { html } from "@typed/template";

export const SearchPreferences = component(function* () {
  const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" });
  const query = yield* RefSubject.hydrate(Schema.String, "scope");
  return html`<section ref=${RefSubject.hydrateAll(page, query)}>
    <output>Page ${page}; query ${query}</output>
  </section>`;
});
```

Named members use their `data-*` attributes; unnamed members share a versioned envelope. Duplicate
named attributes are a configuration error. Codec failures and required services remain typed.
Static HTML rendering omits hydration metadata entirely.

## Test the resource and the handoff you actually depend on

For the observer, count acquisition/finalization across fresh render, keyed removal, and spread-ref
removal. Assert the callback receives the expected native object. For hydrated state, assert both
the decoded value and adopted node identity; valid state and compatible DOM are separate checks.

Continue with [Hydrating Typed HTML](/explore/hydrating-typed-html) for adoption diagnosis and
[Hydrated template state](/explore/refsubject-template-hydration) for schema/envelope behavior.
