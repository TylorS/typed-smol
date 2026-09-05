---
slug: web-component
title: "Use Web Components and Typed together"
summary: "Render custom elements as ordinary HTML, or host a scoped Typed render inside an element."
---

Publish a profile element that can appear in a Typed screen, a static page, or another framework's application. The element definition below uses Typed internally; consumers only need an element and a content property. The definition owns the child render and its subscription, while the surrounding page decides where the host belongs.

An attribute is a string contract and can appear in server HTML. A property can hold objects but needs the element definition to be ready; assigning a property before upgrade can shadow a prototype setter. Either wait for `customElements.whenDefined` before setting rich values or implement the element's documented pre-upgrade property handling. Do not assume an arbitrary custom element handles that race.

## Custom-element output inside Typed

Custom elements are HTML. Use them directly in `html`, with the same reactive attributes, properties, and
native events as any other element.

```ts
import { html } from "@typed/template";

export const profile = html`<typed-profile .content=${"Ada’s profile"}></typed-profile>`;
```

Load the `typed-profile` definition below before this consumer template runs. Typed assigns `.content` while the custom element owns its internal DOM and lifecycle. Here the content is a plain string. To hand the element a live Typed renderable as an object, assign `profile.content` before insertion as shown below; a template property part normally evaluates its reactive input before assigning the resulting value. Use
attributes for serialized configuration, properties for live values, and ordinary Typed event parts for
the element's `CustomEvent`s. `DomRenderEvent` is unnecessary unless a foreign API gives you an already
constructed node instead of markup you can author.

## Typed output inside a custom element

The `TypedProfile` example samples `content` when connected. Assign it before insertion, as shown, and supply a live renderable for updates. It does not implement a setter that replaces the running render. A disconnected element may reconnect during a DOM move; the `#stopping` guard waits for old cleanup before starting again. The browser's [custom-element lifecycle contract](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions) explains why moving and disconnecting cannot be treated as application shutdown.

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
export const stopProfileElements = () => runtime.dispose();

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
profile.content = html`<section><h2>Ada’s profile</h2>
  <output>${Fx.fromIterable(["Loading profile…", "Profile ready"])}</output>
</section>`;
document.body.append(profile);
```

The runtime belongs to the application/definition owner. Call `stopProfileElements` only when that owner shuts down; disconnecting one instance interrupts only that instance's fiber. The server runtime has its own `stopProfileRendering` shutdown function.
`customElements.define()` registers a constructor; it does not mount an instance. Custom-element names are
lowercase and contain a hyphen; use `customElements.whenDefined()` when a consumer must wait for a lazy
definition.

## Decide what a server-rendered element upgrades

The custom-element platform does not prescribe an SSR renderer. A server can serialize its own custom-element markup and
pass trusted output to Typed with `HtmlRenderEvent`; the browser upgrades that markup once its definition
loads.

```ts
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";

const customElementMarkup = "<typed-profile></typed-profile>";
const chartHtml = Fx.sync(() => HtmlRenderEvent(customElementMarkup, true));
```

For Typed output, use a separate application-owned HTML runtime. Its result can be placed in the custom element's light DOM. A declarative shadow root requires a different element implementation that adopts that root; the light-DOM `TypedProfile` shown above does not do so.

```ts
import * as Effect from "effect/Effect";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";

const runtime = ManagedRuntime.make(HtmlRenderTemplate);
export const stopProfileRendering = () => runtime.dispose();
const profile = html`<section><h2>Typed profile</h2></section>`;

const renderProfile = () =>
  runtime.runPromise(Effect.scoped(renderToHtmlString(profile)));
```

For example, a server can place the result inside `<typed-profile>${markup}</typed-profile>`. The definition above starts a fresh DOM render on connection, so this alone does not adopt server nodes. To preserve them, implement a Typed hydration entry that matches the exact server view and initial state; see [server rendering and hydration](/explore/server-rendering-and-hydration). Custom-element upgrade owns the host and any element-specific hydration. Typed hydrates only a
compatible Typed-rendered range; never assign both systems the same descendants.

## Prove the public element survives upgrade and reconnect

Test both definition-before-markup and markup-before-definition. Remove and immediately reinsert the element while its render is active, then verify there is only one subscription. Repeat in a browser; a DOM shim cannot establish every focus or custom-element reaction behavior.

If the element uses shadow DOM, dispatch public custom events with the intended `bubbles` and `composed` settings and test listening from outside the shadow root. Inspect computed styles inside the shadow tree when styles appear missing: page selectors do not generally style shadow descendants. Expose CSS custom properties or documented parts rather than depending on consumers reaching into implementation nodes. See [MDN's shadow DOM guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).

## APIs used

- [`DomRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23DomRenderEvent) preserves exact DOM nodes.
- [`HtmlRenderEvent`](/reference/%40typed%2Ftemplate%2FRenderEvent%23HtmlRenderEvent) carries trusted serialized output.
- [`DomRenderTemplate`](/reference/%40typed%2Ftemplate%2FRender%23DomRenderTemplate) and [`HtmlRenderTemplate`](/reference/%40typed%2Ftemplate%2FHtml%23HtmlRenderTemplate) provide the two output media.
- [`renderToHtmlString`](/reference/%40typed%2Ftemplate%2FHtml%23renderToHtmlString) renders Typed output for an HTML response.
- [Effect scopes](https://effect.website/docs/v4/resource-management/scope/) close the render's resources on interruption.
