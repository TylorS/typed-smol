# `@typed/svelte`

Bidirectional Svelte integration for Typed templates. This package is currently a prototype: the lifecycle, store, SSR, and hydration contracts are exercised, while the API is still expected to evolve.

## Render Svelte inside Typed

`view` turns a Svelte component into a Typed renderable. Props can be a plain value, `Effect`, `Stream`, or `Fx`.

```ts
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Dom, view } from "@typed/svelte";
import Counter from "./Counter.svelte";

const app = Effect.gen(function* () {
  const props = yield* RefSubject.make({ label: "Count" });

  yield* view(Counter, props).pipe(render(document.body), Fx.drain);
}).pipe(Effect.provide(Layer.merge(DomRenderTemplate.using(document), Dom)), Effect.scoped);
```

The Svelte component mounts once. Later prop emissions update an internal Svelte store, so local Svelte state is preserved. Closing the Typed scope unsubscribes from props and unmounts the component.

Callbacks are ordinary component props; the deprecated imperative Svelte event map is not wrapped.

## SSR and hydration

Use the `Html` renderer service on the server and the `Dom` service in the browser for the same `view`.

```ts
import { Effect, Layer } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { Html, view } from "@typed/svelte";
import Counter from "./Counter.svelte";

const head: Array<string> = [];

const markup = await renderToHtmlString(
  view(
    Counter,
    { label: "Count" },
    {
      idPrefix: "counter-",
    },
  ),
).pipe(
  Effect.provide(
    Layer.merge(HtmlRenderTemplate, Html.using({ onHead: (value) => head.push(value) })),
  ),
  Effect.scoped,
  Effect.runPromise,
);
```

The HTML renderer uses the first props emission. `onHead` exposes `<svelte:head>` output without assuming where the application owns its document head. Use stable, distinct `idPrefix` values for multiple islands that use `$props.id()`.

On the client, render the same view into the Typed hydration root with `Dom`. A renderer-owned `display: contents` target keeps Typed's range markers outside Svelte's hydration target, allowing both renderers to reuse their own server markers.

## Typed state as Svelte stores

```ts
import { toReadable, toWritable } from "@typed/svelte";

const readable = yield * toReadable(valuesFx, initialValue);
const writable = yield * toWritable(valueRefSubject);
```

Both subscriptions are owned by the current Effect scope. `toWritable` updates its Svelte store synchronously and schedules the corresponding `RefSubject` transaction through the current Effect context.

The adapters intentionally accept only non-failing Typed sources. A Svelte `Readable<A>` or `Writable<A>` has no error channel; use an explicit `Exit` or result value when failures are part of the state model.

## Render Typed inside Svelte

Create one application-owned `ManagedRuntime` containing `DomRenderTemplate` and every service required by the Typed views:

```ts
import { Layer, ManagedRuntime } from "effect";
import { DomRenderTemplate } from "@typed/template";

export const runtime = ManagedRuntime.make(
  Layer.merge(DomRenderTemplate.using(document), ApplicationLive),
);
```

Then use the real Svelte attachment syntax:

```svelte
<script lang="ts">
  import { html } from "@typed/template";
  import { attachment } from "@typed/svelte";
  import { runtime } from "./runtime.js";

  let label = $state("one");
  const typedView = $derived.by(() => html`<p>${label}</p>`);
</script>

<div {@attach attachment(runtime, typedView)}></div>
```

When the reactive attachment value changes, Svelte interrupts the old Typed render before starting the replacement. Removing the element also interrupts the render, running Typed scope finalizers. The attachment never disposes the `ManagedRuntime`; dispose it once at the application boundary.

Attachments are client-only and do not participate in Svelte SSR.

## Prototype limits

- The custom `display: contents` hosts are unsuitable inside parser-sensitive table internals and SVG.
- Svelte SSR is first-value and buffered rather than streaming.
- The internal bridge ships as `.svelte` source, so consumers need Svelte-aware build tooling.
