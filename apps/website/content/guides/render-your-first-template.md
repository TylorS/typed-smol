---
title: "Render your first template"
summary: "Write a static template, add one live value, and mount it in the browser."
section: "Templates"
kind: "guide"
order: 3
---

`html` describes output; it does not create a DOM node when the tag runs. A renderer turns that
description into DOM or HTML later. This first path stays deliberately small: author a page, mount
it in one owned host, then make one value live.

Install the public packages:

```sh
pnpm add effect@^4 @typed/fx @typed/template @typed/ui
```

## Write and mount a static template

Use ordinary HTML in the tag. Interpolations (`${...}`) are the places Typed can later update. This
first template has none, so it is a fixed page fragment.

```ts
import { Effect, Fiber } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const page = html`<main>
  <h1>Hello, Typed</h1>
  <p>This markup is ordinary HTML.</p>
</main>`;

const host = document.querySelector<HTMLElement>("#app");

if (host === null) {
  throw new Error("Expected #app to exist before mounting the application");
}

const application = Effect.scoped(
  render(page, host).pipe(
    Fx.drain,
    Effect.provide(DomRenderTemplate),
  ),
);

// This is the browser entry-point boundary, for example main.ts.
const fiber = Effect.runFork(application);

// The host keeps `fiber` and interrupts it during its own shutdown sequence.
const stop = () => Effect.runPromise(Fiber.interrupt(fiber));
```

`render(page, host)` owns the content it places in `host`; use a dedicated host when another system
owns nearby DOM. `DomRenderTemplate` is the browser implementation of the renderer service. `Fx.drain`
keeps the render running, and `Effect.scoped` owns its listeners, subscriptions, and cleanup until the
host interrupts `fiber`. `runFork` belongs at this platform boundary, not inside a view; the host's
shutdown path calls `stop` rather than pretending a live render is a Promise that should complete.

## Add one live value

`RefSubject` is current state plus a stream of changes. `component` creates the lazy view and gives
its setup and rendered output the same subscription lifetime.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";

const Counter = component(function* () {
  const count = yield* RefSubject.make(0);

  return html`<section>
    <p>Count: ${count}</p>
    <button type="button" onclick=${RefSubject.increment(count)}>Increment</button>
  </section>`;
});
```

Replace `page` in the mount with `Counter` to render it. The button receives the increment Effect
directly, so each click updates the same subject. The `${count}` hole is a scalar DOM part:
after the first render, the DOM renderer retains its exact text target and updates that target when the
state changes. It does not walk the surrounding document.

An interpolation can also accept ordinary values, an `Effect`, a stream, a nested template, or existing
renderer output. Read [What a template can render](/explore/renderable-normalization) before mixing
those forms, and [Attributes, properties, and boolean state](/explore/template-element-bindings)
before binding native element fields.

## Render HTML on the server

The same `html` value can be rendered without a browser: provide `HtmlRenderTemplate` to
`renderToHtml` or `renderToHtmlString`. Server rendering consumes the initial value of a live source,
so it finishes the response instead of opening a browser-style subscription. See
[Rendering HTML on the server](/explore/rendering-html-on-the-server) for response code and hydration.

## Next steps

- [Handle native events with Effect](/explore/native-events-with-effect) adds a real `onclick` handler.
- [What a template can render](/explore/renderable-normalization) covers `Effect`, `Fx`, arrays, and
  foreign output.
- [Attributes, properties, and boolean state](/explore/template-element-bindings) explains scalar
  fields; [spread props and data records](/explore/template-spreads-data) covers record-shaped parts.
- [Reference the native element](/explore/template-references-and-element-access) covers browser APIs
  that need the exact element.
- [DOM scalar parts and attributes](/explore/dom-parts-and-attributes) follows those parts into the
  renderer; [direct updates and local reconciliation](/explore/dom-updates-and-reconciliation) covers
  structural changes.
- [Schedule DOM rendering](/explore/render-scheduling) changes when updates run without changing which
  DOM part they own.
