---
title: "The template compilation pipeline"
summary: "Build a renderer or framework target on the public Template, HtmlChunk, and RenderEvent contracts."
section: "Integration"
kind: "deep-dive"
order: 10.05
---

Most applications only need `html`, `DomRenderTemplate`, or `HtmlRenderTemplate`. This page is for
the people building another renderer, a framework binding, a test target, or a tool that needs to
understand Typed templates. The public pipeline is deliberately small:

```text
TemplateStringsArray + values
        ↓
RenderTemplate
        ↓
parse → Template AST + part paths + hash
        ↓
DOM fragment / HtmlChunk sequence
        ↓
Fx<RenderEvent, E, R>
```

The static literal is the program. Values are supplied by the caller; a target decides how those
values become output while preserving their Effect error and service channels.

## The public pipeline

`html` receives a real `TemplateStringsArray` from a tagged template literal and returns an inert
`Fx<RenderEvent, E, R>`. It does not parse markup or create a node by itself. The `RenderTemplate`
service is the renderer boundary that receives the literal and its values:

```ts
import { html } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { Fx } from "@typed/fx";
import { Layer } from "effect";

const view = html`<button type="button">Save</button>`;

const BrowserView = render(view, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
);
```

The target supplies the service that interprets the program. A renderer author can provide a
different `RenderTemplate` layer without changing the template or its `Fx` type.

## Parse once, retain part paths

[`parse`](/reference/modules/%40typed%2Ftemplate%2FParser) turns the literal strings into a public
[`Template`](/reference/modules/%40typed%2Ftemplate%2FTemplate) AST. The parser records the authored element
tree and turns each interpolation into a typed part: text, node, attribute, boolean, property,
class, data, event, ref, spread, or a sparse text/attribute value.

The path stored beside each part identifies its location in the static tree. A renderer can use that
path to capture the exact target once, then update that target directly when its value changes. The
path is not a DOM selector and it does not imply ownership of siblings or ancestors.

```ts
import { parse } from "@typed/template/Parser";

const template = parse([
  `<label for="name" class="field">Name <input .value="`, `" /></label>`,
]);

for (const [part, path] of template.parts) {
  console.log(part._tag, path);
}

console.log(template.hash);
```

`Template.hash` is the stable identity for the literal's authored strings. DOM hydration uses it to
check that existing marker ranges were produced by the same template shape. Parsing is synchronous,
fresh, and resource-free; a renderer owns any cache keyed by literal identity.

## Compile for DOM or HTML

The DOM target compiles the AST into a namespace-correct `DocumentFragment`, captures dynamic part
targets, and installs scoped updates. The HTML target compiles the same AST into ordered
[`HtmlChunk`](/reference/modules/%40typed%2Ftemplate%2FHtmlChunk) values:

```ts
import { addTemplateHash, templateToHtmlChunks } from "@typed/template/HtmlChunk";
import { parse } from "@typed/template/Parser";

const template = parse([`<article><h1>`, `</h1></article>`]);
const chunks = templateToHtmlChunks(template);
const hydratable = addTemplateHash(chunks, template);

const html = hydratable.map((chunk) => {
  switch (chunk._tag) {
    case "text":
      return chunk.text;
    case "part":
    case "sparse-part":
      return chunk.render("A title");
  }
}).join("");
```

Static markup is a `text` chunk. A `part` or `sparse-part` retains the parsed context and its
escaping function, so a title interpolation is not accidentally serialized like a node or raw
markup. `addTemplateHash` is for an HTML stream that a browser will later hydrate; static output
can omit those adoption markers. Events do not have an HTML representation, while refs and
renderer-only properties are handled according to the HTML target's documented policy.

## Emit the RenderEvent your target owns

The final boundary is [`RenderEvent`](/reference/modules/%40typed%2Ftemplate%2FRenderEvent).
Use `DomRenderEvent` when the target already owns concrete DOM nodes; use `HtmlRenderEvent` when it
already owns correctly serialized HTML. These constructors do not mount, subscribe, sanitize, or
close anything. The producing `Fx` owns ordering, interruption, errors, and cleanup.

```ts
import { Fx } from "@typed/fx";
import { DomRenderEvent, HtmlRenderEvent } from "@typed/template/RenderEvent";

const domOutput = Fx.sync(() => {
  const element = document.createElement("aside");
  element.textContent = "A foreign renderer's node";
  return DomRenderEvent(element);
});

const htmlOutput = Fx.sync(() =>
  HtmlRenderEvent(`<aside>A foreign renderer's HTML</aside>`, true),
);
```

`DomRenderEvent` carries the exact `Node`, `DocumentFragment`, `Wire`, or nested rendered values;
Typed can insert those values into a bounded dynamic range without recreating them. `HtmlRenderEvent`
is branded renderer-owned transport, not an application-level raw HTML escape hatch. Ordinary values
belong in `html` interpolations, where the HTML target escapes them by context.

## What is public, and what is not

Renderer and framework authors can build against these published modules:

- `@typed/template/Parser` — `parse`
- `@typed/template/Template` — the AST node, attribute, part, and path models
- `@typed/template/HtmlChunk` — `HtmlChunk`, `templateToHtmlChunks`, `addTemplateHash`, and the
  advanced `HtmlChunksBuilder`
- `@typed/template/RenderTemplate` — `RenderTemplate` and `html`
- `@typed/template/Render` and `@typed/template/Html` — the DOM and HTML targets
- `@typed/template/RenderEvent` — `RenderEvent`, `DomRenderEvent`, and `HtmlRenderEvent`

Do not import `@typed/template/internal/*`. Names such as DOM diffing, marker construction,
namespace fragment construction, template hashing, and many-item rendering are implementation
details of the shipped targets, not a public extension point. If a renderer needs a behavior that is not
expressed by the public AST, chunk, service, or event contracts, that is a missing public contract
to discuss—not a reason to couple to an internal module.

A target should test this boundary with the same literal in both media, a scalar part, a sparse
attribute, a boolean, a property, a spread, a nested node output, an Effect failure, and interruption
of a live source. Keep the tests at the public service and `RenderEvent` boundaries so a compiler
can change without changing what framework authors observe.

Continue with [Implement a RenderTemplate target](/explore/implementing-render-template) for the
service contract, or [Server rendering and hydration](/explore/server-rendering-and-hydration) for
the browser adoption side of the HTML pipeline.
