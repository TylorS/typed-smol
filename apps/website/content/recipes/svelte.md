---
slug: svelte
title: "Use Svelte 5 and Typed together"
summary: "Keep one renderer responsible for each DOM range, its state, and its lifetime."
---

Keep an established Svelte document editor while Typed takes over its navigation and document list. The editor can keep its rune state while Typed controls document selection and surrounding layout. Instantiate the bridge once per editor lifetime. Send document metadata through the `Readable` props store; keep unsaved text inside the editor or an explicit shared document service. A new document identity may deliberately require a new editor; a save-status update should only update props.

Before adopting this adapter, use a Svelte 5 build that compiles `.svelte` files, and match its installed Svelte runtime to the compiler. Save the named files shown below together. This is an adapter recipe, not an importable `@typed/svelte` API. [Svelte's imperative API](https://svelte.dev/docs/svelte/imperative-component-api) defines mounting, hydration, and teardown.

## Svelte output inside Typed: mount the editor once

Mount Svelte once in a detached host, then emit that host for Typed to place. A store is the real Svelte 5
prop bridge: it updates the mounted component without remounting or resetting its local state.

```svelte
<!-- Bridge.svelte: private adapter component -->
<script lang="ts" generics="Props extends Record<string, unknown>">
  import type { Component } from "svelte"
  import type { Readable } from "svelte/store"

  type BridgeProps<Props extends Record<string, unknown>> = {
    readonly component: Component<Props>
    readonly props: Readable<Props | undefined>
  }

  let { component: Child, props } = $props<BridgeProps<Props>>()
  let current = $state<Props | undefined>()

  $effect(() => props.subscribe((next) => { current = next }))
</script>

{#if current}<Child {...current} />{/if}
```

```ts file="svelte-in-typed.ts"
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { type Renderable } from "@typed/template";
import { liftRenderableToFx } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import { mount, unmount, type Component } from "svelte";
import { writable, type Readable } from "svelte/store";

type BridgeProps<Props extends Record<string, unknown>> = {
  readonly component: Component<Props>;
  readonly props: Readable<Props | undefined>;
};

export const svelteInTyped = component(function* <Props extends Record<string, unknown>, E, R>(
  Bridge: Component<BridgeProps<Props>>,
  View: Component<Props>,
  values: Renderable<Props, E, R>,
) {
  const host = document.createElement("div");
  const props = writable<Props | undefined>(undefined);
  yield* Effect.acquireRelease(
    Effect.sync(() => mount(Bridge, { target: host, props: { component: View, props } })),
    (instance) => Effect.promise(() => unmount(instance)),
  );

  return Fx.concat(
    liftRenderableToFx<E, R>(values).pipe(
      Fx.mapEffect((next) =>
        Effect.sync(() => {
          props.set(next);
          return DomRenderEvent(host);
        }),
      ),
    ),
    Fx.never,
  );
});
```

The first bridge update enables `<Child>`; subsequent store updates patch its props. The same host is emitted each time, so neither Typed placement nor the prop stream recreates the Svelte instance.

`liftRenderableToFx` keeps the input's errors and services on the returned Typed component. The `Scope` that
runs it unmounts Svelte; Typed never touches the host’s Svelte-owned children.

## Supply an editor that owns its draft

Save the following component as `DocumentEditor.svelte` beside the private `Bridge.svelte`. Import both in your application and call `svelteInTyped(Bridge, DocumentEditor, values)`, where each value has `title` and `saved` props. Keep the draft out of the incoming metadata object so that a save-status update cannot accidentally replace text the user is editing.

```svelte
<!-- DocumentEditor.svelte -->
<script lang="ts">
  let { title, saved } = $props<{ title: string; saved: boolean }>()
  let draft = $state("")
</script>

<section>
  <h2>{title}</h2>
  <label>Document text <textarea bind:value={draft}></textarea></label>
  <p aria-live="polite">{saved ? "Saved" : "Unsaved changes"}</p>
</section>
```

This editor makes the bridge's state contract observable: change `saved` while typing and the draft survives. Changing the selected document may instead require resetting the draft or mounting a new editor. Make that identity transition explicit in the parent; do not smuggle it into a routine props update. The component above illustrates local draft ownership, not a complete save workflow.

## Typed output inside Svelte: keep the inverse slot stable

The application creates one DOM runtime and disposes it when the application stops—not when a Svelte component
unmounts. The component starts one scoped render and its `$effect` cleanup interrupts only that render fiber.

```ts file="typed-runtime.ts"
// Application-owned browser runtime.
import { ManagedRuntime } from "effect";
import { DomRenderTemplate } from "@typed/template/Render";

export const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));
export const stopSvelteApplication = () => runtime.dispose();
```

```svelte
<!-- TypedSlot.svelte -->
<script lang="ts">
  import * as Effect from "effect/Effect"
  import * as Fiber from "effect/Fiber"
  import type * as Scope from "effect/Scope"
  import * as Fx from "@typed/fx/Fx"
  import { type Renderable } from "@typed/template"
  import { render } from "@typed/template/Render"
  import type { RenderTemplate } from "@typed/template/RenderTemplate"
  import { runtime } from "./typed-runtime.js"

  let { value } = $props<{
    readonly value: Renderable<unknown, never, RenderTemplate | Scope.Scope>
  }>()
  let host = $state<HTMLDivElement>()
  let pending = Promise.resolve()

  $effect(() => {
    const element = host
    const current = value
    if (element === undefined) return
    let cancelled = false
    let fiber: Fiber.Fiber<void, never> | undefined
    const started = pending.then(() => {
      if (!cancelled) fiber = runtime.runFork(Effect.scoped(Fx.drain(render(current, element))))
    })
    pending = started
    return () => {
      cancelled = true
      pending = started.then(async () => {
        if (fiber !== undefined) await runtime.runPromise(Fiber.interrupt(fiber))
      })
    }
  })
</script>

<div bind:this={host}></div>
```

Svelte owns the outer `div`; Typed owns its children. Do not dispose `runtime` here: it can serve other Svelte
components. A live Typed renderable updates its child range without a Svelte remount. In the editor, this inverse slot can display a Typed-owned synchronization status alongside Svelte-owned text.

```ts file="save-status.ts"
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";

export const saveStatus = html`<output>${Fx.fromIterable(["Saving document…", "Document saved"])}</output>`;
```

Save the slot above as `TypedSlot.svelte`. A Svelte screen can now import the actual Typed value and pass it once to that slot:

```svelte
<!-- EditorScreen.svelte -->
<script lang="ts">
  import TypedSlot from "./TypedSlot.svelte"
  import { saveStatus } from "./save-status.js"
  let draft = $state("")
</script>

<label>Document text <textarea bind:value={draft}></textarea></label>
<TypedSlot value={saveStatus} />
```

The imported value has stable identity. Typing updates the Svelte draft without recreating the Typed status subscription. The finite status values are a deterministic stand-in for your application's actual save source; replace that source with the save workflow, keeping the same host and runtime ownership. The application entry calls `stopSvelteApplication` only when the whole browser application ends.

## Server rendering and hydration

Svelte server output can be a Typed HTML render event. This is renderer-owned, trusted framework output—not a
general raw-HTML API.

```ts
import * as Fx from "@typed/fx/Fx";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { type Component } from "svelte";
import { render } from "svelte/server";

export const svelteHtml = <Props extends Record<string, unknown>>(
  View: Component<Props>,
  props: Props,
) => Fx.sync(() => HtmlRenderEvent(render(View, { props }).body, true));
```

The server example inserts `render(...).body` only. A component using `<svelte:head>` also produces head output; the server page owner must collect and insert that output once. Do not silently drop titles, metadata, or required styles when turning a complete Svelte page into a body fragment. See [Svelte server rendering](https://svelte.dev/docs/svelte/svelte-server).

For the inverse, create a separate server runtime from `HtmlRenderTemplate`; the Svelte component receives its
completed trusted fragment at the SSR boundary.

```ts file="typed-html-runtime.ts"
// Owned and disposed by the server application.
import * as Effect from "effect/Effect";
import { ManagedRuntime } from "effect";
import { type Renderable } from "@typed/template";
import { renderToHtmlString, HtmlRenderTemplate } from "@typed/template/Html";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type * as Scope from "effect/Scope";

const runtime = ManagedRuntime.make(HtmlRenderTemplate);

export const renderTypedHtml = (value: Renderable<unknown, never, RenderTemplate | Scope.Scope>) =>
  runtime.runPromise(Effect.scoped(renderToHtmlString(value)));

export const stopHtmlApplication = () => runtime.dispose();
```

```svelte
<!-- TypedHtml.svelte: server boundary for renderer-owned, trusted output -->
<script lang="ts">
  let { html } = $props<{ readonly html: string }>()
</script>

{@html html}
```

`{@html}` is appropriate only for the trusted string returned by `renderTypedHtml`, never user data. On the
client, choose one owner for those descendants: leave this server fragment static, or mount/hydrate Typed in a
separate Typed-owned host. Do not ask Svelte and Typed to hydrate the same HTML range. The application owner
disposes each `ManagedRuntime` after its browser or server lifetime ends.

## Prove the editor keeps its draft and closes its effects

Mount a real editor, type a draft, push a prop update, and verify that both its node and draft survive. Await Svelte's rendering boundary before asserting the DOM: scheduling a store update is not the same as seeing its output. Remove the Typed parent and confirm Svelte effect cleanup and store unsubscription. Decide whether closing the editor should wait for an outro; `unmount` accepts the framework's outro policy, which changes when finalization completes.

When the inverse slot changes `value`, Svelte reruns its effect. It does not await an asynchronous cleanup callback, so `pending` serializes old-fiber interruption before a new render starts, and `cancelled` skips a queued mount that has already been removed. Keep `value` stable for ordinary reactive updates. The complete learning path is [DOM output](/integrate/dom-output), [components](/explore/building-ui-components), then [server rendering and hydration](/explore/server-rendering-and-hydration).
