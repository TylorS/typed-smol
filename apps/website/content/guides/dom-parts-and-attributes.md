---
title: DOM scalar parts and attributes
summary: See which exact DOM location each scalar template interpolation owns and what one push changes.
section: DOM and platform
kind: deep-dive
order: 5.1
---

Which part changes when a scalar value arrives? The parser turns each interpolation into a part with
one exact target. The renderer subscribes to that value once and closes over the target. A later
scalar push does not walk a component tree or search the document.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const query = Fx.fromIterable(["", "typed"]);
const locked = Fx.fromIterable([false, true]);

const search = html`<input
  aria-label="Search"
  .value=${query}
  ?disabled=${locked}
/>`;
```

The `.value` stream writes one live property and the `?disabled` stream toggles one boolean
attribute. Neither rebuilds the input or searches the surrounding document.

| Template syntax | Owned location | Update |
| --- | --- | --- |
| `${value}` in text | one text or comment target | set `textContent` |
| `name=${value}` | one attribute node | set or remove that attribute |
| `?disabled=${value}` | one boolean attribute | toggle attribute presence |
| `.value=${value}` | one DOM property | assign that property |
| `.data=${record}` | keys contributed by this data part | reconcile local `data-*` keys |
| `class=${value}` | tokens contributed by this class part | reconcile its local token set |
| `onclick=${handler}` | one native event registration | register it in the render Scope |
| `...${properties}` | properties contributed by this spread | reconcile that local property set |

These updates are O(1) with respect to the surrounding page. Collection-valued class, data, and
spread parts cost the size of their own local collection.

## Attributes and properties are different contracts

Use an attribute for serialized element metadata and a property for live DOM state. For example,
`value=${text}` sets an HTML attribute; `.value=${text}` updates the input's current value property.
The distinction matters after a user edits a form control.

Boolean attributes use presence, not a string value. `?disabled=${false}` removes `disabled`; it
does not render `disabled="false"`, which HTML still treats as disabled.

Each stream updates the location named by its syntax. Updating `.value` does not rebuild the input,
replace its listeners, or touch its other attributes.

## Data and spread parts remember their own keys

`.data=${record}` reconciles only keys previously emitted by that data part. Removing `status` from
the next record removes its `data-status`; an unrelated `data-*` attribute added elsewhere remains.
Spread properties use the same local-ownership idea across their supported property, event, and ref
surface.

Avoid constructing a new spread object merely to update one known property. A direct part makes the
target and cost clearer.

## Events stay native

Event parts register with the platform's `EventTarget`. Typed does not manufacture a synthetic event
class. Delegation may forward a Proxy with the correct `currentTarget`, but the event remains the
browser's event and retains cancellation, propagation, composed paths, pointer or keyboard data,
and default behavior.

The rendering Scope owns the listener. Closing it removes that listener without removing handlers
installed by other code.

## Collections have their own local cost

A scalar part has one target, but class, data, and spread inputs contain local collections. Their
work is proportional to the previous and next collection they reconcile, not to the page. Read
[Class names without className replacement](/explore/dom-class-names) for the class-token ledger.

## Structure is the separate case

A node interpolation owns a bounded dynamic range rather than one scalar target. It can insert,
remove, or move only values represented inside that range. Read
[Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) for its cost model,
then [Using DomRenderEvent](/explore/dom-render-event) for exact foreign DOM output.
