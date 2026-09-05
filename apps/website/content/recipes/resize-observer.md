---
slug: resize-observer
title: Measure a chart host with ResizeObserver
summary: Turn element measurements into a scoped Fx without rebuilding a chart or measuring during server rendering.
---

A chart inside a resizable dashboard panel needs its container's size, not just the window size. `ResizeObserver` tracks the element; Typed places the chart host and displays measurements; the adapter owns disconnecting the observer. This works with canvas and foreign chart libraries because they can keep their own descendants.

Read [DOM output](/integrate/dom-output) first. Prefer CSS container queries when the result is purely a styling choice. Use JavaScript measurement when a canvas or imperative renderer needs numeric dimensions.

## Observe the actual container

This browser-only component creates one host, observes its content rectangle, and renders width and height outside it. It does not change the measured element's size in response to its own measurement, which avoids a common resize feedback loop.

```ts
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { component } from "@typed/ui/Component";

type Size = { readonly width: number; readonly height: number };

const sizes = (element: Element) => Fx.callback<Size>((emit) => {
  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((entry) => entry.target === element);
    if (entry !== undefined) {
      emit.succeed({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }
  });
  observer.observe(element);
  return Effect.sync(() => observer.disconnect());
});

export const MeasuredChartHost = component(function* () {
  const host = document.createElement("div");
  host.style.cssText = "width:100%;height:16rem;min-width:0";
  host.setAttribute("aria-label", "Chart drawing area");
  const dimensions = sizes(host).pipe(
    Fx.map(({ width, height }) => `${Math.round(width)} × ${Math.round(height)} CSS pixels`),
  );
  return html`<figure>
    ${Fx.sync(() => DomRenderEvent(host))}
    <figcaption>${dimensions}</figcaption>
  </figure>`;
});
```

The observer installs when the caption's live value subscribes and disconnects when the render stops. A detached element may initially measure zero; do not initialize expensive drawing buffers from zero and assume that is its final size. The same host remains in the template while measurements change.

For a real chart, acquire its instance once and call its resize API from the measurement stream. Connect its `destroy`/dispose operation to the same component Scope. Creating another chart on every resize leaks renderer resources and resets zoom state. The exact chart API belongs in a library-specific adapter; `DomRenderEvent` only handles placement.

## Distinguish CSS pixels from canvas pixels

The example reports the content rectangle in CSS pixels. A high-density canvas may need backing-store dimensions based on device pixels, while its CSS box stays unchanged. Account for the drawing API's scaling contract before multiplying dimensions, and choose the observer box option deliberately. Borders and padding make content-box and border-box sizes different. The [ResizeObserver reference](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) describes these measurement surfaces and loop errors.

## Verify a resize without recreating the host

In a browser test, resize the parent panel, await a measurement satisfying the expected dimensions, and assert that the host is still the same node. Change sidebar width without resizing the window to catch implementations listening to the wrong event. Hide and reveal the panel, then remove it and confirm the observer disconnects.

If the browser reports an observation loop, inspect whether your resize callback changes the observed box, directly or through surrounding layout. Scheduling a write for another frame may separate reads and writes, but it does not fix an unstable sizing equation. During SSR render a stable placeholder and start this component only at a browser boundary; use [Astro's client-only policy](/integrate/astro) when the component itself creates DOM during setup.
