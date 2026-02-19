# @typed/template

> **Beta:** This package is in beta; APIs may change.

`@typed/template` provides **declarative UI over Effect**: HTML literals (`html`), a stream of **RenderEvent**s, DOM and HTML rendering, hydration, and event handling. Templates are Fx streams; you provide **RenderTemplate** (e.g. **DomRenderTemplate** for the browser or **HtmlRenderTemplate** for SSR). Use it for type-safe, reactive UIs that integrate with Effect and RefSubject.

## Dependencies

- `effect`
- `@typed/fx`
- `html5parser`
- `happy-dom` (dev)

## API overview

- **Templates:** `html` tag; **Renderable**; **Template** module.
- **Rendering:** `render(template, container)` — renders an Fx of RenderEvent into a DOM node; **RenderTemplate** (service); **DomRenderTemplate**, **HtmlRenderTemplate** (layers); **RenderEvent**, **DomRenderEvent**, **HtmlRenderEvent**.
- **Services (Render):** **CurrentRenderDocument**, **CurrentRenderQueue**, **CurrentRenderPriority**.
- **Events:** **EventHandler**; **EventSource**; **RenderEvent**.
- **Hydration:** **HydrateContext**, **makeHydrateContext**.
- **Other:** **Parser**, **Wire**; **HtmlChunk**, **RenderQueue**; subpaths `@typed/template/Render`, `@typed/template/Html`, `@typed/template/HtmlChunk`, etc.

## Example

```ts
import { Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);
  return html`<div>
    <button onclick=${RefSubject.increment(count)}>Increment</button>
    <button onclick=${RefSubject.decrement(count)}>Decrement</button>
    <p>Count: ${count}</p>
  </div>`;
});

// Inside Effect.gen(function* () { ... })
yield* render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
);
```

See the [counter example](https://github.com/typed-smol/typed-smol/tree/main/examples/counter) for a full app.

## API Reference

### Main entry (`@typed/template`)

| Export | Description |
|--------|-------------|
| **Templates** | |
| `html` | Tag function for HTML template literals; returns an `Fx<RenderEvent, E, R>`. Requires `RenderTemplate` in context. |
| `many(values, getKey, render)` | Renders a reactive list with keyed diffing; `values` is an `Fx<ReadonlyArray<A>>`, `getKey` maps items to keys, `render(ref, key)` returns an Fx of RenderEvents. |
| **RenderEvent** | |
| `RenderEvent` | Union of `DomRenderEvent` and `HtmlRenderEvent`. |
| `DomRenderEvent(content)` | Constructor for a DOM render result; `content` is `Rendered` (from `Wire`). |
| `HtmlRenderEvent(html, last)` | Constructor for an HTML-string render result; `last` indicates final chunk. |
| `isRenderEvent`, `isDomRenderEvent`, `isHtmlRenderEvent` | Type guards for `RenderEvent` variants. |
| **Renderable** | |
| `Renderable<A, E, R>` | Type of values that can be interpolated: primitives, arrays, `Effect`, `Fx`/`Stream`, objects. `Renderable.Any`, `Renderable.Services`, `Renderable.Error`, `Renderable.Success` for type-level helpers. |
| **EventHandler** (`EventHandler` namespace) | |
| `EventHandler.make(handler, options?)` | Creates an event handler; `handler` can return `void` or `Effect`; `options` can include `preventDefault`, `stopPropagation`, `once`, `passive`, etc. |
| `EventHandler.provide`, `EventHandler.catchCause` | Provide services or recover from errors. |
| `EventHandler.preventDefault`, `stopPropagation`, `stopImmediatePropagation`, `once`, `passive` | Combinators that add listener options. |
| `EventHandler.fromEffectOrEventHandler`, `EventHandler.isEventHandler` | Coerce from Effect or check type. |
| **EventSource** | |
| `makeEventSource()` | Creates an `EventSource` with `addEventListener` and `setup(rendered, scope)`. |
| **Hydration** | |
| `HydrateContext` | Service tag for hydration context (internal shape). |
| `makeHydrateContext(rootElement)` | Builds a service map with hydration context for the given root element. |
| **Parser** | |
| `parse(template)` | Parses a `TemplateStringsArray` (or readonly string array) into a `Template.Template`. |
| **RenderTemplate** | |
| `RenderTemplate` | Service that implements template rendering; callable as `(templateStrings, values) => Fx<RenderEvent, E, R>`. |
| **Template** | |
| `Template` (namespace) | `Template` class (nodes, hash, parts), part/element node types (`NodePart`, `AttrPartNode`, `EventPartNode`, etc.), and AST node types. |
| **HtmlChunk** | |
| `HtmlChunk`, `HtmlTextChunk`, `HtmlPartChunk`, `HtmlSparsePartChunk` | Types for pre-compiled HTML chunks. |
| `templateToHtmlChunks(template)`, `addTemplateHash(chunks, template)` | Build chunks from a parsed template; add hash comments for hydration. |
| **Wire** | |
| `Wire`, `Rendered` | Wire is a persistent fragment-like type; `Rendered` is the DOM output type. `persistent(document, templateHash, fragment)`, `toHtml(rendered)`, and internal helpers. |
| **RenderQueue** | |
| `RenderQueue` (abstract), `MixedRenderQueue`, `RenderPriority` | Queue for batched DOM updates; priorities like `RenderPriority.Sync`, `RenderPriority.Raf(n)`, `RenderPriority.Idle(n)`. |

### `@typed/template/Render`

| Export | Description |
|--------|-------------|
| `render(fx, where)` / `render(where)(fx)` | Mounts an Fx of `RenderEvent`s into the DOM element `where`; provides `HydrateContext` from `where`. Returns Fx of rendered DOM. |
| `DomRenderTemplate` | Layer providing DOM-based `RenderTemplate`. `DomRenderTemplate.using(document)` for a custom document. |
| `CurrentRenderDocument` | Service reference for the `Document` used when rendering (default: global `document`). |
| `CurrentRenderQueue` | Service reference for the render queue (default: `MixedRenderQueue`). |
| `CurrentRenderPriority` | Service reference for default task priority (default: `RenderPriority.Raf(10)`). |
| `ToRendered<T>` | Type: rendered DOM for `RenderEvent` or `null`. |
| `attemptHydration(ctx, hash)` | Internal helper for hydration. |
| `TemplateContext` | Internal render context type. |

### `@typed/template/Html`

| Export | Description |
|--------|-------------|
| `renderToHtml(fx)` | Converts an Fx of `RenderEvent`s into an Fx of HTML strings (for SSR). |
| `renderToHtmlString(fx)` | Effect that collects `renderToHtml` output and joins into a single string. |
| `HtmlRenderTemplate` | Layer providing HTML-string `RenderTemplate` (for SSR). |
| `StaticHtmlRenderTemplate` | Like `HtmlRenderTemplate` with static rendering optimizations. |
| `StaticRendering` | Service reference (boolean) for static rendering mode. |

