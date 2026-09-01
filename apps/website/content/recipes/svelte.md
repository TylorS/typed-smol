---
slug: svelte
title: Use Svelte 5 and Typed together
summary: Keep one renderer responsible for each DOM range, its state, and its lifetime.
---

Svelte and Typed compose at an empty host element. Its owner may update every descendant; the other renderer
may only place or remove the host. This gives each renderer one hydration boundary too.

## Svelte output inside Typed

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

```ts
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

`liftRenderableToFx` keeps the input's errors and services on the returned Typed component. The `Scope` that
runs it unmounts Svelte; Typed never touches the host’s Svelte-owned children.

## Typed output inside Svelte

The application creates one DOM runtime and disposes it when the application stops—not when a Svelte component
unmounts. The component starts one scoped render and its `$effect` cleanup interrupts only that render fiber.

```ts
// typed-runtime.ts: owned and disposed by the application entry point
import { ManagedRuntime } from "effect";
import { DomRenderTemplate } from "@typed/template/Render";

export const runtime = ManagedRuntime.make(DomRenderTemplate);
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

  $effect(() => {
    if (host === undefined) return
    const fiber = runtime.runFork(Effect.scoped(Fx.drain(render(value, host))))
    return () => { void runtime.runPromise(Fiber.interrupt(fiber)) }
  })
</script>

<div bind:this={host}></div>
```

Svelte owns the outer `div`; Typed owns its children. Do not dispose `runtime` here: it can serve other Svelte
components. A live Typed renderable updates its child range without a Svelte remount.

```ts
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";

export const liveProfile = html`<output>${Fx.fromIterable(["42", "43"])}</output>`;
```

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

For the inverse, create a separate server runtime from `HtmlRenderTemplate`; the Svelte component receives its
completed trusted fragment at the SSR boundary.

```ts
// typed-html-runtime.ts: owned and disposed by the server application
import * as Effect from "effect/Effect";
import { ManagedRuntime } from "effect";
import { type Renderable } from "@typed/template";
import { renderToHtmlString, HtmlRenderTemplate } from "@typed/template/Html";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type * as Scope from "effect/Scope";

const runtime = ManagedRuntime.make(HtmlRenderTemplate);

export const renderTypedHtml = (value: Renderable<unknown, never, RenderTemplate | Scope.Scope>) =>
  runtime.runPromise(Effect.scoped(renderToHtmlString(value)));
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
