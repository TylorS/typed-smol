---
title: Using DomRenderEvent
summary: Carry exact Nodes, DocumentFragments, Wires, and nested rendered values through a Typed dynamic range without cloning them.
section: DOM and platform
kind: guide
order: 5.3
---

`DomRenderEvent(content)` is the terminal DOM output value. It says: these exact rendered objects are
ready to enter a Typed-owned dynamic range. It is not a mount API, a virtual node, or a lifecycle
container.

## Emit the exact node you created

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";

const chart = Fx.sync(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 320;
  return DomRenderEvent(canvas);
});

const page = html`<section aria-label="Price chart">${chart}</section>`;
```

`Fx.sync` is lazy and creates one canvas for each run. If the node already exists, use
`Fx.succeed(DomRenderEvent(node))`. If a foreign system pushes replacements, use `Fx.callback` and
return its cleanup Effect. The producer contract and the output representation are separate choices.

## Supported content

`content` is `Rendered`: a `Node`, `DocumentFragment`, `Wire`, or nested readonly collection of those
values. `valueOf()` returns that exact content. `toString()` serializes its current DOM for diagnostics
or an explicit non-streaming boundary; serialization does not change the event into HTML transport.

A `DocumentFragment` is consumed by DOM insertion, as the platform specifies. Use a `Wire` when a
multi-node value must retain a stable identity after insertion. Use nested collections when one
emission intentionally represents several rendered values.

## What the receiving range owns

The receiving dynamic part may insert, move, or remove the represented nodes inside its comment
boundary. It does not claim their descendants from the foreign renderer, rewrite their classes,
replace their listeners, or remove siblings outside the range.

When a represented node is already connected and must change position, the renderer prefers
`ParentNode.moveBefore`; `insertBefore` is the compatibility fallback. The same node identity keeps
browser-owned state such as focus, selection, animation, custom-element state, dialog/popover state,
and iframe state whenever the platform move preserves it.

## Lifecycle belongs to the producing component

Creating a `DomRenderEvent` acquires nothing. A chart, editor, or framework root still needs a
scoped producer that pairs mount with teardown. For Template/UI setup, use
`component(function* (...args?) { ... })` from `@typed/ui/Component`; yield
`Effect.acquireRelease` inside that generator when a resource needs explicit setup and teardown. The
component is lazy, and the running Effect [Scope](https://effect.website/docs/v4/guides/essentials/scope/)
owns resources until the render is interrupted or its scope closes. For a lower-level
listener/unsubscribe API, use `Fx.callback` and return its cleanup Effect. Do not attach disposal to
the event and do not watch DOM removal as a second lifecycle system.

## Test identity, not an implementation story

At the adapter boundary, assert `event.valueOf() === node`. At the integration boundary, push a
second state value and assert the host node remains `===` while its foreign-owned descendants update.
Finally interrupt the receiving Scope and assert the foreign teardown runs once. Those assertions
cover the cooperative contract without duplicating the foreign renderer's own tests.

For a full foreign renderer adapter, continue with the
[DOM output recipe](/integrate/dom-output). For string transport, use
[HtmlRenderEvent](/explore/html-render-event) instead of serializing live nodes.
