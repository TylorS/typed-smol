---
slug: web-component
title: "Use Web Components and Typed together"
summary: "Render custom elements as ordinary HTML, or host a scoped Typed render inside an element."
---

Web Components work in both directions. A custom element placed inside Typed owns its own descendants; a
custom element hosting Typed owns an otherwise empty child range. See [MDN's custom element guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) and the [HTML Custom Elements specification](https://html.spec.whatwg.org/multipage/custom-elements.html).

## Custom-element output inside Typed

Custom elements are HTML. Use them directly in `html`, with the same reactive attributes, properties, and
native events as any other element.

```ts
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";

const symbol = Fx.fromIterable(["TYPED", "EFFECT"]);

export const chart = html`<acme-chart
  theme="matrix"
  .symbol=${symbol}
></acme-chart>`;
```

Typed updates the `.symbol` property while the custom element owns its internal DOM and lifecycle. Use
attributes for serialized configuration, properties for live values, and ordinary Typed event parts for
the element's `CustomEvent`s. `DomRenderEvent` is unnecessary unless a foreign API gives you an already
constructed node instead of markup you can author.

## Typed output inside a custom element

The application or element-definition module owns a `ManagedRuntime`; it is not created or disposed for
each element connection. Each element starts one scoped render and interrupts only that render when removed.

```ts
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import * as Fx from "@typed/fx/Fx";
import { html, type Renderable } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { RenderTemplate } from "@typed/template/RenderTemplate";

const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));

class TypedProfile extends HTMLElement {
  content: Renderable<unknown, never, RenderTemplate | Scope.Scope> = html`<p>Loading...</p>`;
  #fiber: Fiber.Fiber<void, never> | undefined;
  #stopping: Promise<void> | undefined;

  connectedCallback(): void {
    if (this.#fiber !== undefined) return;
    if (this.#stopping !== undefined) return;
    this.#fiber = runtime.runFork(
      Effect.scoped(Fx.drain(render(this.content, this))),
    );
  }

  disconnectedCallback(): void {
    const fiber = this.#fiber;
    this.#fiber = undefined;
    if (fiber === undefined) return;
    const stopping = runtime.runPromise(Fiber.interrupt(fiber));
    this.#stopping = stopping;
    void stopping.then(() => {
      if (this.#stopping !== stopping) return;
      this.#stopping = undefined;
      if (this.isConnected) this.connectedCallback();
    });
  }
}

if (customElements.get("typed-profile") === undefined) {
  customElements.define("typed-profile", TypedProfile);
}

const profile = document.createElement("typed-profile") as TypedProfile;
profile.content = html`<section><h2>Typed profile</h2></section>`;
document.body.append(profile);
```

The runtime belongs to the application/definition owner and is disposed only when that owner shuts down.
`customElements.define()` registers a constructor; it does not mount an instance. Custom-element names are
lowercase and contain a hyphen; use `customElements.whenDefined()` when a consumer must wait for a lazy
definition.

## HTML output and hydration

Custom Elements have no framework SSR renderer. A server can serialize its own custom-element markup and
pass trusted output to Typed with `HtmlRenderEvent`; the browser upgrades that markup once its definition
loads.

```ts
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const customElementMarkup = "<acme-chart symbol=\"TYPED\"></acme-chart>";
const chartHtml = Fx.sync(() => HtmlRenderEvent(customElementMarkup, true));
```

For Typed output, use a separate application-owned HTML runtime. Its result can be placed in the custom
element's light DOM, or in a declarative shadow root when the element definition adopts that shadow root.

```ts
import * as Effect from "effect/Effect";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";

const runtime = ManagedRuntime.make(HtmlRenderTemplate);
const profile = html`<section><h2>Typed profile</h2></section>`;

const renderProfile = () =>
  runtime.runPromise(Effect.scoped(renderToHtmlString(profile)));
```

For example, insert the result as `<typed-profile>${markup}</typed-profile>` for light DOM, or as
`<typed-profile><template shadowrootmode="open">${markup}</template></typed-profile>` for declarative
shadow DOM. Custom-element upgrade owns the host and any element-specific hydration. Typed hydrates only a
compatible Typed-rendered range; never assign both systems the same descendants.

## APIs used

- [`DomRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23DomRenderEvent) preserves exact DOM nodes.
- [`HtmlRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23HtmlRenderEvent) carries trusted serialized output.
- [`DomRenderTemplate`](/reference/%40typed%2Ftemplate%2FRender%23DomRenderTemplate) and [`HtmlRenderTemplate`](/reference/%40typed%2Ftemplate%2FHtml%23HtmlRenderTemplate) provide the two output media.
- [`renderToHtmlString`](/reference/%40typed%2Ftemplate%2FHtml%23renderToHtmlString) renders Typed output for an HTML response.
- [Effect scopes](https://effect.website/docs/v4/resource-management/scope/) close the render's resources on interruption.
