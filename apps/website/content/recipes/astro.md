---
slug: astro
title: Typed templates in Astro
summary: Let Astro own pages and Markdown while Typed renders and hydrates reactive islands with explicit lifetimes.
---

Astro is a good fit for pages that are mostly content with a few places that need live state. `@typed/astro` lets those places use the same Typed templates and UI components as the rest of your application.

This documentation site uses that integration. The guides are Markdown; the search dialog, theme control, and interactive examples are Typed islands.

## Install the integration

The integration is currently available in this repository as `packages/astro`. Its npm release is separate from the existing Typed beta packages. To try it before publication, use this workspace or build and pack the package for local installation.

The workspace website declares `@typed/astro` as a `workspace:*` dependency. It uses Astro 7, Effect v4, and the matching versions of `@typed/fx`, `@typed/template`, and `@typed/ui`.

Register the integration in `astro.config.ts`:

```ts
import { defineConfig } from "astro/config";
import typed from "@typed/astro";

export default defineConfig({
  integrations: [typed()],
});
```

## Write an ordinary Typed view

`Component.make` marks a component so Astro can recognize it without calling unrelated framework components. The callback receives props and returns a Typed view. It can also return an Effect that acquires state before returning the view.

```ts
import * as Component from "@typed/astro/Component";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";

export default Component.make(({ initial = 1 }: { readonly initial?: number }) =>
  Fx.gen(function* () {
    const quantity = yield* RefSubject.make(initial);
    const total = RefSubject.map(quantity, (value) => value * 24);

    return html`<section>
      <h2>Your order</h2>
      <output>${quantity} items · $${total}</output>
      ${Button({
        content: "Add an item",
        onclick: RefSubject.increment(quantity),
      })}
    </section>`;
  }),
);
```

Save that component as `src/components/Quantity.ts`, then import it into an Astro page:

```astro
---
import Quantity from "../components/Quantity";
---
<h1>Review your order</h1>
<Quantity initial={2} client:load />
```

Astro passes serializable props to the browser. The component recreates its state from those props. If the server computes a different initial value, pass that value explicitly or use [RefSubject hydration](/explore/refsubject-template-hydration) with the template's state ref.

## Choose when the island starts

| Directive | When to use it |
| --- | --- |
| No client directive | Render HTML only; no event handlers run in the browser. |
| `client:load` | Controls people may use immediately. |
| `client:idle` | Secondary controls that can wait until the browser is idle. |
| `client:visible` | Examples and widgets lower down the page. |
| `client:media="(min-width: 60rem)"` | An island needed only for a matching media query. |
| `client:only="@typed/astro"` | A component that requires the browser during setup and should skip server rendering. |

With server rendering, the Typed renderer writes hydration markers. The browser renderer uses those markers to adopt matching nodes and attach live state and listeners. The [Astro directives documentation](https://docs.astro.build/en/reference/directives-reference/) defines the loading policies.

## Keep services and cleanup explicit

The integration supplies the rendering service and an Effect Scope. Provide application services inside the callback with normal Fx or Effect provisioning. Each island has its own running lifetime; one island does not silently acquire another's services.

Closing an island interrupts its Typed work. Re-rendering an existing island closes its old lifetime before starting the replacement. State created inside the callback is recreated on replacement; put deliberately shared state behind an explicitly shared service.

Initial render failures reject rendering. A failure after hydration emits a `typed:error` event on the island. Connect reporting at that boundary when your application needs it.

## Pass Astro content through a Typed layout

The second callback argument contains named slots as renderable values:

```ts
import * as Component from "@typed/astro/Component";
import { html } from "@typed/template";

export default Component.make((_props: {}, slots) => html`<article>
  <header>${slots.heading}</header>
  <div>${slots.default}</div>
</article>`);
```

Astro owns the slot content. Treat it as opaque output and insert each slot once. The integration preserves existing slot nodes during hydration, including nested islands. It does not turn component props into trusted HTML.

## Style the native markup

Use Astro's [Tailwind integration](https://docs.astro.build/en/guides/styling/#tailwind) and [DaisyUI setup](https://daisyui.com/docs/install/astro/) normally. Ensure Tailwind scans the TypeScript files containing your templates. UI hosts accept classes, so the same button behavior can use a project's own visual language.

The [Astro package reference](/reference/packages/%40typed%2Fastro) lists the full integration surface. For the underlying rendering contract, continue with [server rendering and hydration](/explore/server-rendering-and-hydration).
