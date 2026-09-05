---
title: "Attributes, properties, and boolean state"
summary: "Choose the exact browser field a scalar interpolation owns, including sparse attributes and boolean presence."
section: "Templates"
kind: "deep-dive"
order: 3.15
---

An interpolation in an element opening tag is not one generic “prop.” Its spelling selects a
native DOM surface. That choice matters when the value changes: a normal attribute changes the
serialized attribute, a property changes the live object, and a boolean attribute changes whether
the attribute exists at all.

The table is a useful first pass. The sections below define the set, clear, and ownership behavior
of each form.

| Syntax | Target | When a value changes |
| --- | --- | --- |
| `name=${value}` | one HTML, SVG, or MathML attribute | serializes a value; `null` and `undefined` remove it |
| `name="before-${value}"` | one sparse attribute | joins its authored segments and writes the resulting string |
| `.name=${value}` | one DOM property | assigns the value as-is |
| `?name=${value}` | one boolean attribute | a truthy value adds it; a falsy value removes it |

Each scalar attribute, property, and boolean part retains its exact native target during a
mount. A later scalar update is O(1) with respect to the surrounding tree. That does not make a
whole template mount O(1).

## Attributes serialize values

Use an ordinary attribute when the browser's attribute is the thing you mean: `aria-*`, `role`,
`title`, `id`, `href`, and similar markup metadata. Typed converts non-nullish values to text. In a
full attribute part, `null` and `undefined` remove the attribute; `false` is not a removal signal
and becomes the string `"false"`.

```ts
import { html } from "@typed/template";

const label = "Open workspace settings";

export const settingsButton = html`<button
  aria-label=${label}
  data-description="Action: ${label}"
>
  Settings
</button>`;
```

`aria-label=${label}` is a full part. `data-description="Action: ${label}"` is a sparse attribute:
the literal text and the dynamic segment are joined in authored order. A nullish sparse segment
becomes an empty string; it does not remove the surrounding attribute. Use the full form when
absence is meaningful.

## Properties write live element state

Prefix a name with `.` when the value belongs to the element object instead of its serialized
markup. Typed assigns the received value directly; it does not stringify it and it does not use
`null` or `undefined` as a special removal convention. This is the right form for live control
state such as an input's `value` or a checkbox's `indeterminate` property.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const text = Fx.fromIterable(["Ada", "Grace"]);
const indeterminate = true;

export const nameControl = html`<input
  .value=${text}
  .indeterminate=${indeterminate}
/>`;
```

For example, `value="Ada"` is an attribute in the markup, whereas `.value=${"Ada"}` assigns the
input's current `value` property. Do not use a property part simply because an attribute has a
similar name; choose the browser contract you need after the user and the platform have had a
chance to change the element.

## Boolean attributes use presence

Boolean HTML attributes do not use the text `"true"` or `"false"`. Their native meaning is whether
the attribute is present. Prefix the name with `?` so the part uses that model. The value is coerced
by JavaScript truthiness: `true`, a non-empty string, and a non-zero number add the attribute;
`false`, `null`, `undefined`, `0`, and `""` remove it. In particular, the string `"false"` adds the
attribute because it is truthy.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const disabled = Fx.fromIterable([false, true]);

export const saveButton = html`<button ?disabled=${disabled}>Save</button>`;
```

This updates the `disabled` attribute's presence. It does not assign a `disabled` property and it
never produces `disabled="false"`.

Records and element lifetimes have different cost and ownership rules. Continue with
[Spread props and data records](/explore/template-spreads-data) for `.data`, classes, nested
properties, event handlers, and per-key cleanup; then read
[Reference the native element](/explore/template-references-and-element-access) for `ref` timing,
Scope ownership, and hydration. [Native events with Effect](/explore/native-events-with-effect)
covers listeners, while [DOM scalar parts and attributes](/explore/dom-parts-and-attributes) follows
these bindings into the renderer-level cost model.
