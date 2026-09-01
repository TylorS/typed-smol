---
title: Authoring Typed templates
summary: Write renderer-neutral structure with html, then choose the exact dynamic part and browser behavior you mean.
section: Templates
kind: concept
order: 3.1
---

`html` is a template tag, not a DOM constructor. It records authored static markup and the positions
of dynamic values, then returns an inert `Fx<RenderEvent, E, R>`. A later
[`RenderTemplate`](/reference/%40typed%2Ftemplate%2FRenderTemplate%23RenderTemplate) service decides
whether that program becomes browser DOM or HTML for a response. Use a template whenever you can say
which markup is fixed and which exact platform field changes over time.

Static template strings are author-owned markup. Ordinary interpolated values are data: they are
not a raw HTML escape hatch. That distinction gives templates a stable security and composition
boundary without requiring a virtual-node representation.

## Author markup, interpolate values

Start with ordinary HTML and put values where the browser already has a named behavior. This works
for a static snapshot, an Effect, an Fx, a Stream, or another template; the next guide explains how
those values normalize.

```ts
import { html } from "@typed/template";

const title = "Workspace preferences";
const timezone = "America/New_York";

export const preferences = html`<section aria-labelledby="preferences-title">
  <h1 id="preferences-title">${title}</h1>
  <p>Timezone: ${timezone}</p>
</section>`;
```

The literal section and headings are static template structure. Each interpolation is a separately
addressable template part. The renderer can therefore update one part without re-reading the whole
template or replacing the section that contains it.

## Choose the part you mean

The character before an interpolation is meaningful. It names the browser surface Typed owns.

| Syntax | Use it for | Browser operation |
| --- | --- | --- |
| `${value}` | text or a structural node position | text update or a local dynamic range |
| `name=${value}` | serialized metadata such as `aria-label` | set/remove one attribute |
| `?disabled=${value}` | boolean HTML attributes | toggle attribute presence |
| `.value=${value}` | live element state | assign one DOM property |
| `class=${value}` | class tokens Typed contributes | reconcile Typed's local token set |
| `.data=${record}` | `data-*` keys Typed contributes | reconcile those local keys |
| `...${record}` | a group of supported properties | reconcile that record's local keys |
| `onclick=${handler}` | a native listener | attach one scoped event handler |
| `ref=${ref}` | a DOM reference lifecycle | invoke the ref when the node is available |

Use this table as a map, then follow the contract you need. [Attributes, properties, and boolean
state](/explore/template-element-bindings) defines the scalar forms. [Spread props and data
records](/explore/template-spreads-data) covers record ownership and the spread allowlist.
[Reference the native element](/explore/template-references-and-element-access) covers `ref`
timing, cleanup, and hydration.

The following template uses three different browser contracts on purpose. `aria-label` is an
attribute, `.value` is the current input value, and `?disabled` is attribute presence rather than
the string `"false"`.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const query = Fx.fromIterable(["", "typed"]);
const locked = Fx.fromIterable([false, true]);

export const searchField = html`<input
  aria-label="Search documentation"
  .value=${query}
  ?disabled=${locked}
/>`;
```

Use an attribute for serialized markup and a property for live browser state. For example,
`value=${"draft"}` describes the initial attribute while `.value=${"draft"}` controls the input's
current value. Choosing the smaller part also makes ownership clear: Typed does not claim every
property or attribute on the element.

## Compose templates, not HTML strings

A nested template is normal rendered output, so keep reusable structure as a template rather than
assembling markup in a string. The HTML renderer escapes ordinary dynamic strings; if a value is
already renderer-owned serialized HTML, that is the explicit advanced `HtmlRenderEvent` integration
boundary—not an application-level raw HTML shortcut.

```ts
import { html } from "@typed/template";

const field = (label: string, value: string) => html`<label>
  <span>${label}</span>
  <input .value=${value} />
</label>`;

export const profileForm = html`<form>
  ${field("Display name", "Ada")}
  ${field("Timezone", "America/New_York")}
</form>`;
```

This is composition through the same output contract used by larger views. The parent template does
not need a special component protocol to include the child; each nested template keeps its own
dynamic parts and typed error/requirement channels.

## Static structure, dynamic behavior

Calling `html` is lazy. It does not create a node, subscribe to `query`, attach an event listener,
or start an Effect. A DOM or HTML renderer does that later inside its running Scope. This lets the
same description serve a browser mount, server response, test document, or reusable library primitive.

The DOM renderer caches parsed static structure by template-literal identity and clones it when a
view mounts. A mount is therefore proportional to the template's static nodes and parts; later
scalar updates are direct only because the renderer retained the exact target during that mount.
Read [Attributes, properties, and boolean state](/explore/template-element-bindings) for authoring
semantics, then [DOM scalar parts and attributes](/explore/dom-parts-and-attributes) for the
renderer-level ownership and cost model.

Next, [What a template can render](/explore/renderable-normalization) explains precisely how each
interpolated value reaches its part and how its errors and service requirements remain visible.
