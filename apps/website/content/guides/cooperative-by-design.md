---
title: Cooperative by design
summary: Decide exactly which template parts, DOM ranges, and lifetimes Typed owns.
section: DOM and platform
kind: concept
order: 6
---

When Typed renders into a document that other code can also see, what is it allowed to change?
The answer is concrete: a render owns the output it inserts, each template part owns its target,
and the application remains responsible for every field and range it did not give to Typed.

This is a contract for application developers and library authors alike. It does not require a
private component tree or an exclusive renderer. It requires that each dynamic value has one clear
writer and one clear lifetime.

## See the boundary in a template

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const count = Fx.fromIterable([0, 1, 2]);
const editor = document.createElement("x-editor");
editor.textContent = "Foreign output";
const foreignView = Fx.succeed(DomRenderEvent(editor));

const view = html`<article class="workspace-shell">
  <h1>Workspace</h1>
  <output>${count}</output>
  <section>${foreignView}</section>
</article>`;
```

`html` only describes the template and returns an `Fx`; it does not create the article or attach
listeners. The `output` interpolation owns one text target. The `section` interpolation owns one
dynamic range and may insert or move the editor node. The static heading and class are authored
template content. Anything outside this output remains outside the template's ownership.

An `Fx` is a push-based description of values that arrive over time. A running
[Effect](https://effect.website/docs/v4/getting-started/the-effect-type/) gives it a lifetime. The
[Effect Scope](https://effect.website/docs/v4/resource-management/scope/) is the resource boundary:
it owns subscriptions, queued work, listeners, and finalizers acquired while the view runs.

## Four decisions make ownership explicit

### The template owns a description, not a document

The parsed `Template` retains static nodes, dynamic-part indexes, paths, and a hydration hash. It
owns no live `Node`, producer, listener, or Scope. `DomRenderTemplate` interprets that description
for a `Document`; `HtmlRenderTemplate` interprets it for HTML output. The syntax does not claim that
either renderer owns the entire application.

### A part owns one target or range

Typed does not update a page-wide virtual tree for a scalar change. It captures the target of each
part:

- text and comment parts write `textContent`;
- ordinary attributes use `setAttribute` or `removeAttribute`;
- boolean parts toggle attribute presence;
- property parts assign the native property;
- class and data parts reconcile their local tokens or keys;
- event parts register one native listener in the render Scope;
- node parts reconcile only the nodes between their comment markers.

Two systems should not write the same property or dynamic range concurrently. If another library
owns `.value`, do not also make Typed the writer for `.value`. If Typed owns a class token, another
system should not independently use that same token as its lifecycle signal.

### The root host is a mount slot

`render(value, host)` is intentionally stronger than a nested node part. The host is the root slot:
when the root output changes, the renderer uses `replaceChildren` for that host. Give it a dedicated
element when the host contains children owned elsewhere. If shared content must remain beside the
view, put the view in a child node part or use a dedicated mount element.

Inside a template, the boundary is narrower. A dynamic node part has an end comment; its diff can
insert, remove, move, or replace represented nodes before that marker without traversing or clearing
the surrounding article.

### The running Scope owns cleanup

Calling `html`, constructing a `DomRenderEvent`, or creating an `EventHandler` is inert. Work starts
when the returned `Fx` is run. Closing its Scope interrupts dynamic producers, removes delegated
listeners, cancels queued callbacks, closes child scopes, and runs finalizers. It does not dispose a
foreign renderer unless the adapter acquired that renderer in the same Scope.

For a foreign renderer, pair acquisition and release at the adapter boundary:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const host = document.createElement("div");
const mounted = Fx.unwrapScoped(
  Effect.acquireRelease(
    Effect.sync(() => {
      const node = document.createElement("x-editor");
      host.append(node);
      return { node, dispose: () => node.remove() };
    }),
    (view) => Effect.sync(() => view.dispose()),
  ).pipe(Effect.map((view) => Fx.succeed(DomRenderEvent(view.node)))),
);
```

The foreign `mount` operation does not need to return an `Fx`. `Fx.unwrapScoped` keeps the acquired
view alive while its output is observed and releases it when the output completes, fails, or is
interrupted. The receiving Typed range owns placement; the foreign renderer owns its internal
resources.

## The DOM remains the platform

Typed event syntax describes real `EventTarget` listeners. Capture, passive, abort signals, default
prevention, propagation, and `once` remain native browser behavior. The callback receives a
non-pooled proxy over the native event: `target`, properties, and bound methods come from the browser,
while `currentTarget` identifies the registered element. The proxy is not object-identical to the
native event.

Because Typed does not replace the platform, ordinary markup remains the integration API:

```ts
import { html } from "@typed/template";

const controls = html`<button popovertarget="filters" popovertargetaction="toggle">
    Filters
  </button>
  <div id="filters" popover="manual">...</div>
  <dialog>...</dialog>`;
```

Custom elements, form controls, focus, selection, dialog/popover state, anchor positioning, and
other browser behavior remain available. Typed can update the parts it owns while the browser stays
the authority for native semantics.

## Identity has a browser consequence

When a keyed dynamic range reorders an already-parented node, Typed first tries
`ParentNode.moveBefore`. If the method is unavailable or throws, it falls back to `insertBefore`.
Both operations retain the same JavaScript node object. Only the successful `moveBefore` path has
the platform's state-preserving move semantics; fallback insertion can disconnect and reconnect a
custom element and can lose focus, selection, or other browser-managed state.

`many(values, getKey, render)` supplies the identity contract that makes this useful: retained keys
keep their child Scope and nodes, moved keys are moved rather than remounted, and removed keys close
only their child Scope. See [Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation)
for the local cost model and [Using DomRenderEvent](/explore/dom-render-event) for exact foreign DOM
output.

## When this boundary is the wrong one

Do not use a Typed dynamic part when another system must own the same DOM range, when the host is
not a dedicated mount slot, or when the value is untrusted HTML. Choose one owner for a property or
range. Use ordinary escaped template interpolation for application data. Use `HtmlRenderEvent` only
when a renderer already owns safe serialization, and use [the integration recipes](/integrate) when
you are writing the adapter itself.

## Verify the contract

The smallest useful test mounts `view` into a dedicated `slot` beside an unowned `aside`, changes
the dynamic value, and checks both boundaries: the text changes, the `aside` is still the same
object, and closing the render Scope removes only Typed's listeners and output. That is the
cooperative contract in a form you can verify without reproducing another renderer's implementation.
