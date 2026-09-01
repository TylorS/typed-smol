---
title: Preserve multi-node DOM output
summary: Hand existing DOM output across a renderer boundary, including a stable multi-node range when one is genuinely needed.
section: DOM and platform
kind: deep-dive
order: 5.35
---

`Rendered` is the DOM-side output contract: a `Node`, `DocumentFragment`, `Wire`, or a nested
readonly collection of those values. Application and integration code can hand any of those exact
objects to `DomRenderEvent`. Typed then works with the object it received; it does not recreate its
children or put an element around a multi-node value.

Most application code needs a node or a fragment. `Wire` is the small extra tool for a renderer that
must keep a **multi-node** result addressable after normal DOM insertion has consumed its source
fragment.

## Pass a real DOM value

`DomRenderEvent` is the boundary value. It carries `Rendered`; it does not mount the value or take
over the producer's lifetime.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import type { Rendered } from "@typed/template/Wire";

const heading = document.createElement("h2");
heading.textContent = "Account settings";

const details = document.createDocumentFragment();
details.append(document.createTextNode("Change your profile and sign-in options."));

const output: Rendered = [heading, details];
const event = DomRenderEvent(output);
```

The receiving dynamic range may insert, remove, or move only the values represented by `event`.
The browser still owns the node identities themselves: listeners, focus, selection, custom-element
state, and foreign descendants remain attached to those exact nodes. A native `DocumentFragment`
is consumed when the DOM inserts it—that is normal platform behavior. Use one when you only need a
one-time group of children.

## Make a multi-node range persistent

`persistent` accepts a newly assembled fragment. Empty output stays a fragment, one child stays a
node, and two or more children become a `Wire`: a transparent comment-bounded range with a stable
multi-node identity. The range can subsequently move together without an extra wrapper element.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { persistent } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
const title = document.createElement("h2");
title.textContent = "Order summary";
const total = document.createElement("p");
total.textContent = "$42.00";
fragment.append(title, total);

const templateIdentity = "checkout-summary-v1"; // a unique-template-id-or-hash
const output = persistent(document, templateIdentity, fragment);
const event = DomRenderEvent(output);
```

The identity must identify the template or renderer shape that produced the range—use a real
unique-template-id-or-hash, not a generic label such as `"foreign-view"`. That makes the boundary
comments unambiguous when output is inspected or adopted. Once connected, a `Wire` moves its exact
nodes as one range; where the browser provides it, Typed can use `moveBefore`, with `insertBefore`
as the compatibility path. No child is cloned.

Use this only when a producer needs that persistent group. A normal fragment is simpler, and a
single root element already has its own native identity.

## Treat boundary comments as renderer extension territory

`fromComments` is public because hydration and renderer extensions sometimes already own exact
range markers. It is marked **internal-but-published**, not an onboarding API. Application code
should normally use `persistent` and let it create the comments.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { fromComments } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
const start = document.createComment("orders:start");
const order = document.createElement("article");
order.textContent = "Order #1042";
const end = document.createComment("orders:end");
fragment.append(start, order, end);

const wire = fromComments(fragment, start, end);
const event = DomRenderEvent(wire);
```

An extension using `fromComments` owns both boundaries and every node between them. Do not point it
at comments from another renderer, infer a range from arbitrary markup, or use it to claim a
parent's unrelated siblings. Low-level reconciliation adapters have additional published helpers,
but those are deliberately outside this application-facing guide.

## Inspect detached output deliberately

`getElements` gives event delegation or a host adapter the concrete element roots. `toHtml` produces
a current HTML snapshot; it is not a streaming SSR renderer and it does not sanitize markup.

```ts
import { getElements, persistent, toHtml } from "@typed/template/Wire";

const fragment = document.createDocumentFragment();
const label = document.createElement("label");
label.textContent = "Email";
const input = document.createElement("input");
input.type = "email";
fragment.append(label, input);

const output = persistent(document, "email-field-v1", fragment);
const roots = getElements(output);
const snapshot = toHtml(output);
```

For a `Node` or detached `DocumentFragment`, those utilities are straightforward observation. For a
`Wire`, they normalize through `valueOf()`: the range is gathered back into its retained
`DocumentFragment`. That is a consuming conversion, so inspect a `Wire` before handing it to a
mounted renderer, or explicitly treat the conversion as moving the range out of its current parent.
They are not a live-DOM inspection API for a mounted Wire.

`DomRenderEvent` simply carries the same `Rendered` contract forward. Use it at the point an
adapter has produced real DOM output; keep mount, updates, and cleanup in the producer's `Fx` or
Effect Scope. For the receiving range and foreign-node ownership rules, continue with
[Using DomRenderEvent](/explore/dom-render-event). For a renderer that wants trusted string output
instead, use [HtmlRenderEvent](/explore/html-render-event).
