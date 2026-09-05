---
title: "Interpolate into text-only elements"
summary: "Keep textarea, title, script, and style content in the context the browser gives it, with explicit limits around escaping, closing tags, and trust."
section: "Templates"
kind: "deep-dive"
order: 3.28
---

Some HTML elements do not contain ordinary child markup. The browser treats their contents as one
text context: `textarea`, `title`, `script`, `style`, and the legacy `xmp` element. Typed preserves
that distinction instead of trying to parse a dynamic value as a new child tree. A value interpolated
there is text for that element; it does not create a nested button, listener, or template range.

`plaintext` is recognized while parsing, but it cannot be closed reliably in HTML and cannot carry
Typed's hydration boundary. Rendering a `plaintext` template throws. Do not use it in a document.

## Text-only means text, not child markup

The same `html` tag can describe a text area, document title, structured-data script, or stylesheet.
The dynamic value remains data until the renderer writes it into that element. In the DOM renderer,
that means text content. In the HTML renderer, it means a context-aware serialized chunk.

```ts
import { html } from "@typed/template";

const notes = "<em>not markup</em>";

export const editor = html`<label>
  Notes
  <textarea name="notes">${notes}</textarea>
</label>`;

export const documentTitle = html`<title>${"Typed documentation"}</title>`;
```

The `<em>` in `notes` is displayed as text inside the `textarea`; it is not parsed into an element.
This is different from a node position such as `${html`<em>...</em>`}`, where a nested template is
renderer-owned output. The same interpolation can be an `Effect`, `Stream`, or `Fx`; the renderer
keeps its normal producer lifetime while applying this element's text rules.

## Choose the context deliberately

Text-only contexts are useful when the browser already provides the format you need. They are not
interchangeable:

| Element | Good use | Ordinary interpolated value |
| --- | --- | --- |
| `textarea` | editable text with an initial value | HTML-escaped text |
| `title` | the document title | HTML-escaped text |
| `script` | JSON data or authored JavaScript | text with the matching `</script>` opener neutralized |
| `style` | authored CSS or serialized CSS data | text with the matching `</style>` opener neutralized |
| `xmp` | legacy text display only | text with the matching `</xmp>` opener neutralized |

For `textarea` and `title`, ordinary values use the normal HTML text escaping rules. For `script`,
`style`, and `xmp`, Typed keeps the content text-oriented and neutralizes a dynamic matching closing
tag so the value cannot end its surrounding element in the serialized response. That boundary rule
does not make the value valid JavaScript or CSS, and it does not choose a safe URL, policy, or
serialization format for you.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const structuredData = Fx.succeed(
  JSON.stringify({
    "@context": "https://schema.org",
    name: "Typed",
  }),
);

const css = Fx.succeed(".notice { color: teal; }");

export const head = html`<head>
  <script type="application/ld+json">${structuredData}</script>
  <style>${css}</style>
</head>`;
```

Serialize structured data before interpolation. If the value is JavaScript source, generate it with
the rules of the JavaScript format you are producing; Typed does not quote a string into a valid
JavaScript literal for you. The browser's text-only context is a boundary, not a code generator.

## Closing tags need neutralization

An ordinary dynamic value in a normal text or attribute position is HTML-escaped. A script or style
element cannot use that exact strategy: entity text is not a dependable way to protect the HTML
parser's raw-text end tag. Typed instead replaces the `<` that begins a dynamic matching closing tag:
`script` uses a JavaScript-safe `\\u003c`, `style` uses the CSS escape `\\3C `, and `xmp` uses `&lt;`.

The replacement is deliberately narrow. It protects the surrounding raw-text element from a
dynamic `</script>`, `</style>`, or `</xmp>` sequence; it does not sanitize the rest of the value.
Authored literal content remains authored code or CSS and is not inspected for safety.

```ts
import { html } from "@typed/template";

const untrusted = "</script><script>stealSomething()</script>";

export const dataScript = html`<script type="application/json">
  ${JSON.stringify({ untrusted })}
</script>`;
```

Use ordinary interpolation for application data. Never concatenate user input into a literal
`<script>`, `<style>`, or `xmp` body and assume the template tag has sanitized it. For a server
response, [rendering HTML on the server](/explore/rendering-html-on-the-server) applies the same
context rules while preserving ordered output.

## Trusted HTML is a separate boundary

`HtmlRenderEvent` is for a renderer that already owns serialization. It is not a more powerful form
of string interpolation and it is not an application sanitizer. In `textarea` and `title`, its
content still goes through text escaping. In `script`, `style`, and `xmp`, the text-only serializer
uses its renderer-owned string and applies only the matching closing-tag neutralization described
above.

```ts
import { html, HtmlRenderEvent } from "@typed/template";

// This value came from a serializer that owns the JSON format and its trust policy.
const rendererOwnedJson = HtmlRenderEvent(
  '{"@context":"https://schema.org","name":"Typed"}',
  true,
);

export const structuredData = html`<script type="application/ld+json">
  ${rendererOwnedJson}
</script>`;
```

Do not wrap user input, an arbitrary API response, or a hand-built string in `HtmlRenderEvent` to
make it “safe.” Typed does not sanitize JavaScript, CSS, URLs, JSON semantics, or authored literal
markup. The brand records an existing renderer's responsibility; it does not transfer that
responsibility to Typed. See [Using HtmlRenderEvent](/explore/html-render-event) for chunk order and
the [RenderEvent substrate](/explore/render-event-substrate) for the DOM/HTML output boundary.

## Hydration does not make authored code safe

Interactive server rendering adds the template identity needed for the browser renderer to adopt
the matching output. Hydration can preserve the exact text-only element and reconnect its dynamic
part, but it does not re-sanitize the server's literal script, style, title, textarea, or xmp
content. A matching template hash proves identity, not safety.

The security boundary is therefore the same on both sides of the handoff:

- Keep application data in ordinary interpolations so Typed can apply the context's escaping rule.
- Treat literal `script` and `style` bodies as code owned by the author.
- Use `HtmlRenderEvent` only when another renderer owns the complete serialization and trust policy.
- Add application policy for URLs, CSS, JavaScript, and any format-specific validation Typed does not
  provide.

The DOM renderer's text-only behavior is part of the same template contract as SSR; it does not
turn `html` into an HTML sanitizer. Continue with [Hydrating Typed HTML](/explore/hydrating-typed-html)
for the server/client handoff, [What a template can render](/explore/renderable-normalization) for
producer normalization, and [Template references](/explore/template-references-and-element-access)
when a native element needs an explicit browser integration.
