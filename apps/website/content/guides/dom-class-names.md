---
title: "Class names without className replacement"
summary: "Understand the local token ledger that lets Typed update its classes while preserving classes added by other code."
section: "DOM and platform"
kind: "deep-dive"
order: 5.2
---

A dynamic class part does not assign `element.className`. It normalizes its value into tokens,
compares the previous and next tokens contributed by that part, and calls `classList.add` or
`classList.remove` only for the difference.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const tone = Fx.fromIterable(["is-idle", "is-ready"]);

const status = html`
  <output class="status ${tone}">Ready</output>
`;
```

On the first value, the class part records `status` and `is-idle` as its local token set. On the next
value it leaves `status`, removes `is-idle`, and adds `is-ready`. It does not replace the element or
rewrite the entire class attribute.

## External tokens are outside the ledger

Suppose another renderer, a custom element, or an animation library adds `is-animating` after the
element is mounted. That token is absent from Typed's ledger. The next `tone` value therefore leaves
`is-animating` in place.

The inverse boundary matters too: if other code removes a token owned by the class part, Typed does
not continuously police the DOM. An unchanged future value will not necessarily re-add that token;
the class part reacts to its input transitions.

## The same token cannot have two owners

The DOM stores a class token once, without reference counts or provenance. If Typed contributes
`is-ready` and another system independently relies on that exact token, Typed removing its own
`is-ready` contribution removes the shared DOM token. Cooperative ownership therefore works at the
token boundary: separate systems should not claim the same dynamic token unless they coordinate its
lifetime.

## Values normalize before diffing

Strings are split on ASCII whitespace. Arrays are flattened recursively, and nullish values produce
no tokens. This allows a class input to express a single token, a space-separated group, or nested
groups without changing the update contract.

The cost is proportional to the previous and next local token lists. It is O(1) with respect to the
surrounding DOM tree, but not with respect to an arbitrarily large class collection.

## Sparse class attributes share one ledger

`class="status ${tone}"` is parsed as one sparse class expression. Its literal and dynamic pieces are
combined before the token diff. This is why the literal `status` token and the current `tone` token
move through one coherent update instead of competing writes to `className`.

## Hydration uses the same initial snapshot

Hydration does not create a special class policy. The updater snapshots the element's current
`classList` when it is created, whether the element was freshly built or adopted from server HTML.
Those initial tokens participate in the first comparison. Classes added later by another owner are
not added to the ledger and are therefore left alone by later updates.

When the rendered part is reset, it removes the tokens in its recorded set. Keep one writer for a
token that must have an independent lifetime; the DOM stores one token and has no provenance or
reference count.

Continue with [DOM scalar parts and attributes](/explore/dom-parts-and-attributes) for the other
scalar targets, or [Using DomRenderEvent](/explore/dom-render-event) when the value is structural DOM
output rather than a scalar part.
