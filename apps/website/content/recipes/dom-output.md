---
slug: dom-output
title: "Pass existing DOM into Typed"
summary: "Keep the nodes your renderer created. Typed places them without taking over their descendants."
---

Use `DomRenderEvent` when an adapter already has real DOM. It passes those exact objects into a Typed
template. There is no virtual-node conversion and no wrapper element.

## What `DomRenderEvent` carries

The public `Rendered` type is a `Node | DocumentFragment | Wire`, or nested readonly arrays of those
values. `DomRenderEvent` stores the value unchanged.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";

const host = document.createElement("div");
host.className = "code-editor";

const event = DomRenderEvent(host);

event.valueOf() === host; // true
```

Typed does not clone, serialize, or reparse DOM output. The node keeps its identity, properties, event
listeners, custom-element state, focus, and selection.

## Nodes, fragments, and wires

Use a `Node` when the foreign renderer has one host. Use a `DocumentFragment` to hand off several detached
nodes once. Native insertion empties a fragment, so use a `Wire` when a wrapper-free group must remain a
single movable value after insertion.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { persistent } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
fragment.append(
  document.createElement("header"),
  document.createElement("main"),
);

const templateIdentity = "unique-template-id-or-hash";
const content = persistent(document, templateIdentity, fragment);
const event = DomRenderEvent(content);
```

`persistent` returns the single child directly when the fragment contains one node. With several nodes it
returns a `Wire`: a transparent range bounded by comments, not an element added to the page. The second
argument identifies that template range; use a stable ID or template hash, not a component label. If the
range crosses SSR and hydration, the server and browser must use the same identity.

## Who may change what

The adapter owns the node and its descendants. It may render, patch, or replace anything inside that host.
Typed owns only the host's position inside the surrounding dynamic part.

| Owner | May change |
| --- | --- |
| Adapter | The emitted host and everything below it |
| Typed | Where the emitted value appears inside its local range |
| Browser | Native focus, selection, form, dialog, popover, and custom-element state |

Do not let both renderers write the same descendants. A React root, editor, chart, or custom element should
receive a dedicated host; the Typed template controls the markup around it.

## Placement, replacement, and moves

On the first event, Typed inserts the represented nodes at the dynamic part. On the next event it compares
only that local node list:

- the same object in the same position is left alone;
- an absent object is removed from the local range;
- a new object is inserted;
- an existing object in a new position is moved, not recreated.

When an already-parented node moves, Typed uses `ParentNode.moveBefore` when the browser supports it and
falls back to `insertBefore`. Both paths preserve object identity. `moveBefore` additionally preserves
browser-managed state that can be reset by a remove-and-insert move.

This is local reconciliation. Typed does not walk the adapter's descendants or inspect a component tree.

## Make the output live

`DomRenderEvent` is the output value. Wrap it in the smallest producer that matches the renderer. For a host
created once per subscription, that is `Fx.sync`:

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const editor = Fx.sync(() => DomRenderEvent(document.createElement("div")));

export const workspace = html`<main>${editor}</main>`;
```

Use `Fx.callback` only when the renderer actually exposes a callback subscription. The React, Svelte, Vue,
and Web Component recipes show their real mount and update APIs; this page does not invent a generic one.

## Cleanup stays with the adapter

Removing a node from Typed's range does not tell a foreign renderer to unmount. The adapter must connect the
renderer's real cleanup operation to the subscription Scope: `root.unmount()`, Svelte's `unmount`,
`app.unmount()`, an observer's `disconnect()`, or the corresponding library API.

That separation is deliberate. Typed knows where output is placed; the adapter knows what was acquired to
produce it.

## Related APIs

- [`DomRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23DomRenderEvent)
- [`Rendered`](/reference/%40typed%2Ftemplate%2FWire%23Rendered)
- [`Wire`](/reference/%40typed%2Ftemplate%2FWire%23Wire)
- [`persistent`](/reference/%40typed%2Ftemplate%2FWire%23persistent)
