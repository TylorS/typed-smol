---
slug: vue
title: Use Vue and Typed together
summary: Give Vue and Typed separate DOM ranges and connect their lifetimes at one stable host.
---

Vue owns every descendant of its mount element. Typed may place, move, or remove that empty host, but never
write below it. In the other direction, Vue creates an empty host and Typed owns only its children.

## Vue output inside Typed

Mount one Vue app in one detached host. Normalize the props with `liftRenderableToFx`, update that app, and
return the same `DomRenderEvent` for every value. Typed's component Scope unmounts Vue when the host leaves
the Typed range.

```ts
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { html, type Renderable } from "@typed/template";
import { liftRenderableToFx } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import { createApp, defineComponent, h, nextTick, shallowRef } from "vue";

type PriceProps = { readonly symbol: string; readonly last: number };

const prices: Renderable<PriceProps> = Fx.fromIterable([
  { symbol: "TYPED", last: 42 },
  { symbol: "TYPED", last: 43 },
]);

const livePrice = component(function* <E, R>(values: Renderable<PriceProps, E, R>) {
  const current = shallowRef<PriceProps>();
  const Root = defineComponent(
    () => () =>
      current.value === undefined
        ? null
        : h("output", `${current.value.symbol}: ${current.value.last}`),
  );
  const host = document.createElement("div");
  const app = yield* Effect.acquireRelease(
    Effect.sync(() => {
      const app = createApp(Root);
      app.mount(host);
      return app;
    }),
    (app) => Effect.sync(() => app.unmount()),
  );

  return Fx.concat(
    liftRenderableToFx<E, R>(values).pipe(
      Fx.mapEffect((props) =>
        Effect.promise(async () => {
          current.value = props;
          await nextTick();
          return DomRenderEvent(host);
        }),
      ),
    ),
    Fx.never,
  );
});

const page = html`<main>${livePrice(prices)}</main>`;
```

`Fx.never` keeps the single emitted host mounted after a finite source completes. Keep source errors and
services on the returned `Fx`; this example is service-free and cannot fail.

## Typed output inside Vue

Create the DOM runtime once at application bootstrap. Vue owns the outer `div`; its lifecycle starts one
scoped Typed render fiber and interrupts only that fiber before Vue discards the host. Runtime disposal is an
application shutdown concern, not a component-unmount concern.

```ts
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import * as Fx from "@typed/fx/Fx";
import { html, type Renderable } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import { defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from "vue";

// Application bootstrap owns runtime.dispose() during application shutdown.
const runtime = ManagedRuntime.make(DomRenderTemplate);

const TypedSlot = defineComponent({
  props: {
    value: {
      type: Object as PropType<Renderable<unknown, never, RenderTemplate | Scope.Scope>>,
      required: true,
    },
  },
  setup(props) {
    const host = ref<HTMLDivElement>();
    let fiber: Fiber.Fiber<void, never> | undefined;

    onMounted(() => {
      if (host.value !== undefined) {
        fiber = runtime.runFork(Effect.scoped(Fx.drain(render(props.value, host.value))));
      }
    });
    onBeforeUnmount(() => {
      if (fiber !== undefined) void runtime.runPromise(Fiber.interrupt(fiber));
    });
    return () => h("div", { ref: host });
  },
});

const page = h(TypedSlot, { value: html`<h2>Typed profile</h2>` });
```

Pass a live Typed renderable once; it updates its own child range without a Vue watch or remount. Configure
additional services and expected-error handling where the application constructs the value.

## Server rendering

The same boundary exists on the server. Vue's `vue/server-renderer` may contribute trusted framework output to
a Typed HTML stream as an `HtmlRenderEvent`.

```ts
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

const Price = defineComponent(() => () => h("output", "TYPED: 42"));

const vueHtml = component(function* () {
  return Fx.fromEffect(
    Effect.promise(async () => HtmlRenderEvent(await renderToString(createSSRApp(Price)), true)),
  );
});

const page = html`<main>${vueHtml}</main>`;
```

For the inverse, make a separate HTML runtime. `renderToHtmlString` produces Typed renderer output; passing
that string through Vue's `innerHTML` is a trusted, opaque SSR boundary, not a general raw-HTML API.

```ts
import * as Effect from "effect/Effect";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

// Server application bootstrap owns htmlRuntime.dispose() after its work ends.
const htmlRuntime = ManagedRuntime.make(HtmlRenderTemplate);
const TypedHtmlBoundary = defineComponent({
  props: { markup: { type: String, required: true } },
  setup(props) {
    return () => h("section", { innerHTML: props.markup });
  },
});

const renderPage = async () => {
  const markup = await htmlRuntime.runPromise(
    Effect.scoped(renderToHtmlString(html`<h2>Typed profile</h2>`)),
  );
  return renderToString(createSSRApp(TypedHtmlBoundary, { markup }));
};
```

Hydration follows ownership, not markup origin: Vue hydrates Vue-owned hosts. The `innerHTML` descendants
above are opaque to Vue and do not become an interactive Typed island. To hydrate Typed, reserve a separate
empty host that Vue does not render below, then start the DOM-rendering slot after Vue hydrates.
