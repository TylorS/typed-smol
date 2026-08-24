# @typed/template

> **Beta:** This package is in beta; APIs may change.

`@typed/template` provides **type-safe, reactive UIs that integrate with Effect**. It is the core UI layer for typed-smol apps: HTML literals (`html`), DOM rendering, SSR (HTML strings), hydration, event handlers with Effect, and keyed list rendering. Templates are **Fx streams** (`Fx<RenderEvent, E, R>`); you provide a `RenderTemplate` service (e.g. `DomRenderTemplate` for the browser or `HtmlRenderTemplate` for SSR).

## Dependencies

- `effect`
- `@typed/fx`
- `html5parser`
- `happy-dom` (dev)

## Capabilities

- **Reactive interpolation**: Interpolate `Renderable` values—primitives, `Effect`, `Fx`/`Stream`—directly in `html` templates; updates stream through to the DOM.
- **DOM + SSR targets**: Same templates work in the browser (`DomRenderTemplate`) and on the server (`HtmlRenderTemplate`); choose the layer for your environment.
- **Hydration**: Use `makeHydrateContext` to attach to existing SSR DOM instead of creating new nodes; supports keyed lists (`many`).
- **Keyed lists**: `many(values, getKey, render)` renders reactive lists with efficient keyed diffing and per-item `RefSubject` state.
- **EventHandler with Effect**: `EventHandler.make` for type-safe event handlers that return `Effect`; supports `preventDefault`, `stopPropagation`, etc.
- **Batched render queue**: `RenderQueue` and `RenderPriority` (Sync, Raf, Idle) batch DOM updates for smoother rendering.

## When to use

Use `@typed/template` when building Effect-based web UIs, when you need SSR + hydration, or when you want type-safe templates and event handlers. For routing, combine with `@typed/router`. For Link and SSR helpers, use `@typed/ui` on top of template.

## HTML security boundary

Static strings in an `html` template are author-owned markup. Ordinary dynamic child strings and wrapped ordinary values render as text; server rendering HTML-escapes them. To compose renderer-owned markup, nest another `html` template instead of passing markup in an ordinary string.

Dynamic `textarea` and `title` values are escaped. Dynamic `script`, `style`, and `xmp` values cannot close their host element, but this breakout defense is not a JavaScript, CSS, or application-content sanitizer. Dynamic spread and data keys that could select events, properties, refs, prototype-sensitive names, or invalid attribute syntax are not serialized by the HTML renderer. `many` keys are encoded into versioned comment-safe markers.

`HtmlRenderEvent` is low-level renderer transport, not an application raw-markup or sanitization API. Ordinary application data should not construct it. The package currently has no application-facing trusted/raw HTML capability.

## Rendering ownership and lifetime

- `parse` returns a fresh AST. The DOM and HTML render layers separately cache their target-specific compiled entries by template-literal identity; a process that uses both targets may parse the same literal once per target.
- DOM rendering is scoped. Keep the Effect layer returned by `Fx.drainLayer` alive for as long as the mounted template should remain active. Closing that scope removes delegated listeners, interrupts running handler fibers, disposes scheduled part updates, and releases removed keyed children.
- HTML rendering is a finite snapshot. Reactive interpolation and `many` consume the first value needed for that response; use DOM rendering for a live subscription.
- `many` keys must be unique within each emitted list; duplicates fail with `Cause.IllegalArgumentError`. A retained key keeps its child scope and receives the new item through its `RefSubject`; removing the key closes that child scope.
- Hydration adopts a compatible marker range or constructs the template when marker adoption fails. Matching markers do not currently validate all static DOM, so applications must not treat existing hydration DOM as sanitized content.
- A callable `RefSubject.hydrate` value can be placed directly in `ref`. Interactive SSR serializes every attribute entry supplied by its symbol-backed hydration protocol, and DOM rendering invokes the composed ref once before starting ordinary reactive parts. Outside `ref`, the same callable value remains a normal `RefSubject`/`Fx` in direct and nested render positions.

## API overview

- **Templates:** `html` tag; **Renderable**; **Template** module.
- **Rendering:** `render(template, container)` — renders an Fx of RenderEvent into a DOM node; **RenderTemplate** (service); **DomRenderTemplate**, **HtmlRenderTemplate** (layers); **RenderEvent**, **DomRenderEvent**, **HtmlRenderEvent**.
- **Services (Render):** **CurrentRenderDocument**, **CurrentRenderQueue**, **CurrentRenderPriority**.
- **Events:** **EventHandler**; **EventSource**; **RenderEvent**.
- **Hydration:** **HydrateContext**, **makeHydrateContext**.
- **Other:** **Parser**, **Wire**; **HtmlChunk**, **RenderQueue**; subpaths `@typed/template/Render`, `@typed/template/Html`, `@typed/template/HtmlChunk`, etc.

## Package layers

The primary application layer is `@typed/template`, with `@typed/template/Html`, `@typed/template/Render`, `@typed/template/EventHandler`, and `@typed/template/many` as focused supported imports. Prefer the package root unless a focused subpath makes ownership clearer.

Renderer-author and diagnostic machinery is a separate supported beta layer: `EventSource`, `HtmlChunk`, `HydrateContext`, `Parser`, `Renderable`, `RenderEvent`, `RenderQueue`, `RenderTemplate`, `Template`, and `Wire`. These modules expose lower-level ownership and transport contracts and are not necessary for ordinary application templates.

The beta.4 wildcard export remains available unchanged for compatibility, including currently resolvable `internal/*` and other unlisted compiled modules. Those compatibility paths are not a stability promise. Physical `src` and `dist` paths are never supported imports. Published packages contain compiled output, declarations, the manifest, and this README; source files and tests are intentionally excluded. Narrowing the wildcard requires an explicit breaking-API decision.

The release contract pack-installs this artifact and builds a browser consumer from it. The package does not currently declare `sideEffects: false` or promise parser/cache tree-shaking; either claim requires a separate measured release decision.

## Example

```ts
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);

  return html`<p>Count: ${count}</p>
    <button onclick=${RefSubject.increment(count)}>Increment</button>
    <button onclick=${RefSubject.decrement(count)}>Decrement</button>`;
});

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
```

See the [counter example](https://github.com/typed-smol/typed-smol/tree/main/examples/counter) for a full app.

## API Reference

### Main entry (`@typed/template`)

| Export                                                                                          | Description                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Templates**                                                                                   |                                                                                                                                                                                                          |
| `html`                                                                                          | Tag function for HTML template literals; returns an `Fx<RenderEvent, E, R>`. Requires `RenderTemplate` in context.                                                                                       |
| `many(values, getKey, render)`                                                                  | Renders a reactive list with keyed diffing; `values` is an `Fx<ReadonlyArray<A>>`, `getKey` maps items to keys, `render(ref, key)` returns an Fx of RenderEvents.                                        |
| **RenderEvent**                                                                                 |                                                                                                                                                                                                          |
| `RenderEvent`                                                                                   | Union of `DomRenderEvent` and `HtmlRenderEvent`.                                                                                                                                                         |
| `DomRenderEvent(content)`                                                                       | Constructor for a DOM render result; `content` is `Rendered` (from `Wire`).                                                                                                                              |
| `HtmlRenderEvent(html, last)`                                                                   | Constructor for an HTML-string render result; `last` indicates final chunk.                                                                                                                              |
| `isRenderEvent`, `isDomRenderEvent`, `isHtmlRenderEvent`                                        | Type guards for `RenderEvent` variants.                                                                                                                                                                  |
| **Renderable**                                                                                  |                                                                                                                                                                                                          |
| `Renderable<A, E, R>`                                                                           | Type of values that can be interpolated: primitives, arrays, `Effect`, `Fx`/`Stream`, objects. `Renderable.Any`, `Renderable.Services`, `Renderable.Error`, `Renderable.Success` for type-level helpers. |
| **EventHandler** (`EventHandler` namespace)                                                     |                                                                                                                                                                                                          |
| `EventHandler.make(handler, options?)`                                                          | Creates an event handler; `handler` can return `void` or `Effect`; `options` can include `preventDefault`, `stopPropagation`, `once`, `passive`, etc.                                                    |
| `EventHandler.provide`, `EventHandler.catchCause`                                               | Provide services or recover from errors.                                                                                                                                                                 |
| `EventHandler.preventDefault`, `stopPropagation`, `stopImmediatePropagation`, `once`, `passive` | Combinators that add listener options.                                                                                                                                                                   |
| `EventHandler.fromEffectOrEventHandler`, `EventHandler.isEventHandler`                          | Coerce from Effect or check type.                                                                                                                                                                        |
| **EventSource**                                                                                 |                                                                                                                                                                                                          |
| `makeEventSource()`                                                                             | Creates an `EventSource` with `addEventListener` and `setup(rendered, scope)`.                                                                                                                           |
| **Hydration**                                                                                   |                                                                                                                                                                                                          |
| `HydrateContext`                                                                                | Service tag for hydration context (internal shape).                                                                                                                                                      |
| `makeHydrateContext(rootElement)`                                                               | Builds a service map with hydration context for the given root element.                                                                                                                                  |
| **Parser**                                                                                      |                                                                                                                                                                                                          |
| `parse(template)`                                                                               | Parses a `TemplateStringsArray` (or readonly string array) into a `Template.Template`.                                                                                                                   |
| **RenderTemplate**                                                                              |                                                                                                                                                                                                          |
| `RenderTemplate`                                                                                | Service that implements template rendering; callable as `(templateStrings, values) => Fx<RenderEvent, E, R>`.                                                                                            |
| **Template**                                                                                    |                                                                                                                                                                                                          |
| `Template` (namespace)                                                                          | `Template` class (nodes, hash, parts), part/element node types (`NodePart`, `AttrPartNode`, `EventPartNode`, etc.), and AST node types.                                                                  |
| **HtmlChunk**                                                                                   |                                                                                                                                                                                                          |
| `HtmlChunk`, `HtmlTextChunk`, `HtmlPartChunk`, `HtmlSparsePartChunk`                            | Types for pre-compiled HTML chunks.                                                                                                                                                                      |
| `templateToHtmlChunks(template)`, `addTemplateHash(chunks, template)`                           | Build chunks from a parsed template; add hash comments for hydration.                                                                                                                                    |
| **Wire**                                                                                        |                                                                                                                                                                                                          |
| `Wire`, `Rendered`                                                                              | Wire is a persistent fragment-like type; `Rendered` is the DOM output type. `persistent(document, templateHash, fragment)`, `toHtml(rendered)`, and internal helpers.                                    |
| **RenderQueue**                                                                                 |                                                                                                                                                                                                          |
| `RenderQueue` (abstract), `MixedRenderQueue`, `RenderPriority`                                  | Queue for batched DOM updates; priorities like `RenderPriority.Sync`, `RenderPriority.Raf(n)`, `RenderPriority.Idle(n)`.                                                                                 |

### `@typed/template/Render`

| Export                                    | Description                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `render(fx, where)` / `render(where)(fx)` | Mounts an Fx of `RenderEvent`s into the DOM element `where`; provides `HydrateContext` from `where`. Returns Fx of rendered DOM. |
| `DomRenderTemplate`                       | Layer providing DOM-based `RenderTemplate`. `DomRenderTemplate.using(document)` for a custom document.                           |
| `CurrentRenderDocument`                   | Service reference for the `Document` used when rendering (default: global `document`).                                           |
| `CurrentRenderQueue`                      | Service reference for the render queue (default: `MixedRenderQueue`).                                                            |
| `CurrentRenderPriority`                   | Service reference for default task priority (default: `RenderPriority.Raf(10)`).                                                 |
| `ToRendered<T>`                           | Type: rendered DOM for `RenderEvent` or `null`.                                                                                  |
| `attemptHydration(ctx, hash)`             | Internal helper for hydration.                                                                                                   |
| `TemplateContext`                         | Internal render context type.                                                                                                    |

### `@typed/template/Html`

| Export                     | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `renderToHtml(fx)`         | Converts an Fx of `RenderEvent`s into an Fx of HTML strings (for SSR).     |
| `renderToHtmlString(fx)`   | Effect that collects `renderToHtml` output and joins into a single string. |
| `HtmlRenderTemplate`       | Layer providing HTML-string `RenderTemplate` (for SSR).                    |
| `StaticHtmlRenderTemplate` | Like `HtmlRenderTemplate` with static rendering optimizations.             |
| `StaticRendering`          | Service reference (boolean) for static rendering mode.                     |
