---
title: Spread props and data records
summary: Combine native attributes, DOM properties, dataset values, and event handlers without losing their individual semantics.
section: Templates
kind: guide
order: 3.25
---

Template syntax is explicit about which browser surface you are writing to. A plain attribute is
serialized markup; a leading `.` writes a property; `?` controls boolean presence; `.data` writes
`data-*` attributes; and `...` expands a record into those same native operations.

## Start with the surface you mean

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const query = Fx.succeed("typed");
const disabled = Fx.succeed(false);

const search = html`<input
  aria-label="Search"
  value="initial"
  .value=${query}
  ?disabled=${disabled}
/>`;
```

`value=${...}` targets the `value` attribute. `.value=${...}` targets the live DOM property, so it
is the form a user is currently editing. `?disabled=${false}` removes the attribute; it does not
write the string `"false"` (which would still disable an HTML control). A dynamic attribute accepts
ordinary values, `Effect`, `Stream`, or `Fx` values and updates only its captured attribute node.

Use `class=${...}` for class tokens. Typed keeps a token ledger per class part: a later update
removes tokens that part contributed while preserving classes added by another owner. A spread
`class` or `className` entry uses the same ledger.

## `.data` owns a dataset slice

`.data` turns an object into `data-*` attributes. Each value may itself be a renderable, so one
record can mix constants and producers.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const card = html`<article .data=${{
  kind: "result",
  loading: Effect.succeed("false"),
  rank: Fx.succeed(3),
}}></article>`;
```

The record above contributes `data-kind`, `data-loading`, and `data-rank`; the browser exposes
them through `element.dataset.kind`, `element.dataset.loading`, and `element.dataset.rank`. When a
later record omits a key, Typed removes only that key's attribute. Existing `data-*` attributes
with different names remain untouched. Values use the same scalar-to-string conversion as ordinary
dynamic attributes; the HTML renderer additionally escapes them when it serializes markup.

`null`, `undefined`, or a non-object record contributes no keys and therefore clears the keys that
this `.data` part previously emitted. Invalid names and prototype-sensitive keys such as
`__proto__`, `prototype`, and `constructor` are ignored.

## Spread a record when the shape is dynamic

Use `...${record}` when a caller supplies a group of props. The record is reconciled by key: an
unchanged value keeps its existing part, a changed value updates that part, and a removed key is
cleaned up.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { EventHandler, html } from "@typed/template";

const saveProps = {
  "aria-label": "Save draft",
  "?disabled": Fx.succeed(false),
  ".value": "Save",
  ".data": { action: "save" },
  onclick: EventHandler.make(() => Effect.sync(() => console.log("saved"))),
} as const;

const SaveButton = html`<button ...${saveProps}>Save</button>`;
```

These keys retain their meaning inside a spread:

| Record key | Native operation |
| --- | --- |
| `aria-label`, `title`, `id` | set or remove an attribute |
| `?disabled` | toggle boolean attribute presence |
| `.value`, `.checked`, `.indeterminate`, `.selected`, `.selectedIndex` | assign a safe DOM property |
| `class` or `className` | reconcile this part's class tokens |
| `.data` | reconcile nested `data-*` keys |
| `@click` or `onclick` | install a real DOM event handler |
| `ref` | run the ref against the exact element |
| `.props` or `.properties` | recursively spread another record |

Spread property writes are deliberately restricted to the form-control properties above. Use a
direct `.someProperty=${value}` part when you need an arbitrary property and can name it in the
template. A spread cannot replace `constructor`, `prototype`, or `__proto__`, and `on*` keys are
not treated as attributes. Cyclic nested records are ignored at the cycle boundary.

## Ownership is local, including removal

Each spread key gets a local instance in the render Scope. Removing `title` removes that attribute;
removing `.value` restores the value that was present before the spread; removing a handler
unregisters only that handler; and removing `ref` closes the ref's setup. Nested `.data`, `class`,
and `.properties` parts clean up their own keys recursively.

The same ownership rule lets spreads coexist with hand-authored DOM and other renderers when they
own different fields. A spread does not clear all classes, replace the whole dataset, or remove
nodes it did not create. Two writers should not share the same attribute or property target: when
the spread removes that key, it cannot distinguish a later write by another owner.

## Server rendering has a smaller surface

The HTML renderer serializes safe attributes, booleans, classes, `.data`, and nested spreads. It
escapes dynamic strings and omits events, refs, DOM properties, unsafe names, and invalid attribute
names because those have no HTML-attribute equivalent. `Effect`, `Stream`, and `Fx` values are
sampled for the finite server render; the browser renderer is the one that keeps them live.

Read [DOM scalar parts and attributes](/explore/dom-parts-and-attributes) for the single-part cost
model, [class names without className replacement](/explore/dom-class-names) for token ownership,
and [rendering HTML on the server](/explore/rendering-html-on-the-server) for the SSR boundary.
