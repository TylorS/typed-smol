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

