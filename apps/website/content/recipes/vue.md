---
slug: vue
title: "Use Vue and Typed together"
summary: "Give Vue and Typed separate DOM ranges and connect their lifetimes at one stable host."
---

A trading dashboard already has a Vue price card with plugins and local controls. Move its surrounding layout to Typed while keeping that card mounted. Keep Vue plugins, `provide`/`inject`, and component-local state inside the mounted app. Give Typed a stream of plain input props. Mounting one app for every price tick would reset selection and transitions; updating the shallow ref keeps that state with Vue.

`shallowRef` replaces the props object as a unit. This is useful when incoming values are immutable snapshots; if you mutate a nested field in place, that operation does not become reactive merely because Typed emitted the object. Replace the snapshot or choose a Vue-owned reactive model intentionally. The [Vue reactivity reference](https://vuejs.org/api/reactivity-advanced.html#shallowref) describes this distinction.

## Vue output inside Typed: update one dashboard card

Mount one Vue app in one detached host. Normalize the props with `liftRenderableToFx`, update that app, and
return the same `DomRenderEvent` for every value. Typed's component Scope unmounts Vue when the host leaves
the Typed range.

```ts
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import { liftRenderableToFx } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";
import { Button } from "@typed/ui/Button";
import { createApp, defineComponent, h, nextTick, shallowRef } from "vue";

type PriceProps = { readonly symbol: string; readonly last: number };

const livePrice = component(function* <E, R>(values: Renderable<PriceProps, E, R>) {
  const current = shallowRef<PriceProps>();
  const Root = defineComponent(
    () => () =>
      current.value === undefined
        ? null
        : h("section", [
            h("label", ["Alert threshold ", h("input", { type: "number", value: 42 })]),
            h("output", `${current.value.symbol}: ${current.value.last}`),
          ]),
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

export const priceDemo = component(function* () {
  const prices = yield* RefSubject.make<PriceProps>({ symbol: "DEMO", last: 42 });
  return html`<main>
    ${livePrice(prices)}
    ${Button({
      content: "Next price sample",
      onclick: RefSubject.update(prices, (price) => ({ ...price, last: price.last + 1 })),
    })}
  </main>`;
});
```

Edit the Vue-owned alert threshold, then click Typed's “Next price sample.” The input should keep its value while the price changes. The button is a deliberate local source for exploring the boundary; replace that source with your validated market-data feed without changing the Vue mount/update contract. `nextTick` waits for each snapshot to reach the Vue DOM before the host is emitted.

`Fx.never` keeps the single emitted host mounted after a finite source completes. Keep source errors and
services on the returned `Fx`. This local source has no typed failures; an external price feed can retain its error channel through the generic adapter.

## Typed output inside Vue

The reverse `TypedSlot` samples `props.value` during `onMounted`. It is designed for a stable live Typed renderable, not changing Vue prop identity. If the Vue parent must replace that value, add an explicit watcher that interrupts and awaits the old fiber before starting the replacement; otherwise a new prop will be ignored by this slot. Document that contract in your application's wrapper.

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

## Render a request-specific card on the server

The same boundary exists on the server. Vue's `vue/server-renderer` may contribute trusted framework output to
a Typed HTML stream as an `HtmlRenderEvent`.

```ts
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { HtmlRenderEvent } from "@typed/template/RenderEvent";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

const Price = defineComponent(() => () => h("output", "TYPED: 42"));

const vueHtml = Fx.fromEffect(
  Effect.promise(async () => HtmlRenderEvent(await renderToString(createSSRApp(Price)), true)),
);

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

## Prove updates and teardown reach Vue

After each input update, await `nextTick` before reading the Vue-owned DOM. Type into a child input, update the Typed shell and price props, and verify the input remains the same node. Then remove the host and assert that Vue's unmount hooks and any plugin subscriptions run once. The [Vue lifecycle reference](https://vuejs.org/api/composition-api-lifecycle.html) distinguishes mounted DOM from component setup and explains when unmount hooks run.

For SSR, create a fresh Vue app and request-specific state per request; an application-owned HTML rendering runtime does not justify sharing one user's Vue store with another request. Test simultaneous requests with different props. If hydration reports a mismatch, compare the initial props and generated markup before changing either renderer's reconciliation behavior. Continue with [HTML output](/integrate/html-output) and [server rendering and hydration](/explore/server-rendering-and-hydration).
