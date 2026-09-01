---
title: Namespace-aware platform markup
summary: Author SVG and MathML directly; Typed builds the native namespace transitions and attributes the platform expects.
section: Templates
kind: deep-dive
order: 3.375
---

Namespace is part of the markup contract, not a separate render mode. Typed creates the literal
with native DOM namespace APIs, so the tag position determines whether a node is HTML, SVG, or
MathML. A nested template is built again in the namespace of the element that receives it.

## Enter and leave foreign content in the markup

In HTML, `<svg>` starts the SVG namespace and `<math>` starts the MathML namespace. SVG children
stay SVG children until an HTML integration point: `foreignObject`, `desc`, and `title` put their
children back in the HTML namespace. MathML has corresponding text integration points—`mi`, `mo`,
`mn`, `ms`, and `mtext`—and `annotation-xml` enters HTML when its `encoding` is `text/html` or
`application/xhtml+xml`.

That is enough to compose platform markup normally. This icon is SVG until `foreignObject`; the
button inside it is an HTML element with ordinary HTML semantics.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const symbol = Fx.succeed("#selected-marker");

export const selectableIcon = html`<svg viewBox="0 0 20 20" aria-label="Selected">
  <use xlink:href=${symbol} />
  <foreignObject x="0" y="0" width="20" height="20">
    <button type="button" aria-label="Change selection">Change</button>
  </foreignObject>
</svg>`;
```

The same template can be inserted under an HTML parent or an SVG parent. Typed keys its compiled
fragment by that insertion context, so this link becomes an HTML anchor in `navigation` and an SVG
`a` element in `legend`; it does not reuse an HTML fragment in the SVG tree.

```ts
import { html } from "@typed/template";

const link = (label: string) => html`<a href="#details">${label}</a>`;

export const navigation = html`<nav>${link("Details")}</nav>`;
export const legend = html`<svg viewBox="0 0 10 10">${link("Details")}</svg>`;
```

Do not add a namespace attribute or a component wrapper to force those boundaries. Author the
platform element that owns the boundary. The renderer follows the tested HTML parsing integration
points; it does not infer custom namespace transitions from arbitrary tag names.

## Prefixed and case-sensitive attributes follow their element

On an SVG element, `xlink:href` is an attribute in the XLink namespace. That is true for the
literal form and for a dynamic part such as the `use` above. On an HTML element, the identical
spelling is **not namespaced on an HTML element**: it remains an ordinary HTML attribute. Keep a
prefixed attribute on the platform element whose namespace gives it meaning.

Typed also preserves the platform's canonical foreign-content spelling. SVG element and attribute
names such as `foreignObject`, `linearGradient`, and `viewBox` use their SVG case. In MathML,
`definitionurl` is canonicalized to `definitionURL` on a MathML element—the name the browser
exposes—without applying that rule to HTML.

```ts
import { html } from "@typed/template";

const definition = "urn:typed:formula";

export const formula = html`<math>
  <semantics definitionurl=${definition}>
    <mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow>
  </semantics>
</math>`;
```

These rules are deliberately narrow. They make native SVG and MathML markup work beside HTML
without turning Typed into a second schema for the web platform. For scalar ownership, continue
with [Attributes, properties, and boolean state](/explore/template-element-bindings).
