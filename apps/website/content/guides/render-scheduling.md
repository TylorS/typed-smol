---
title: Schedule DOM rendering
summary: Change when local DOM work runs without changing what a template owns or how a dynamic part is updated.
section: DOM and platform
kind: deep-dive
order: 5.5
---

`RenderQueue` changes when a renderer applies a local update. The template still describes the
same owned part; the queue does not replace it with a second reconciler.

## A queue chooses when, not what

Each queue entry has a key, a task, a cleanup function, and a numeric priority. Re-adding the same
key at the same priority disposes the superseded pending entry, so repeated producer emissions can
coalesce before a frame runs. Lower priorities run first: `RenderPriority.Sync` is immediate,
`RenderPriority.Raf(n)` belongs to visual frame work, and `RenderPriority.Idle(n)` is background work.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { MixedRenderQueue, RenderPriority } from "@typed/template/RenderQueue";

const resultCount = Fx.fromIterable([0, 12]);

export const searchStatus = html`<output aria-live="polite">
  ${resultCount} results
</output>`;

const queue = new MixedRenderQueue();

queue.add(
  "search-result-count",
  () => document.documentElement.dataset.searchReady = "true",
  () => delete document.documentElement.dataset.searchReady,
  RenderPriority.Raf(5),
);
```

The returned `Disposable` can cancel an individual pending entry. Disposing a queue cancels its
active scheduler and drops all pending buckets. A renderer Scope performs the corresponding cleanup
for rendering work it scheduled; application code should not reach into the renderer to cancel a
single captured part.

The cost model remains the same after choosing a queue: a scalar part still reaches its retained
target directly when it executes. A structural update still reconciles the local dynamic range. Read
[Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) for the distinction
between direct scalar work and local structural work.

## Provide a queue at the rendering boundary

`CurrentRenderQueue` and `CurrentRenderPriority` are Effect services. A service is an explicit
dependency; `Layer.succeed` is a reusable implementation. Provide scheduling alongside
`DomRenderTemplate` at the mount boundary, so template modules stay independent of a global scheduler.

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { CurrentRenderPriority, CurrentRenderQueue } from "@typed/template/Render";
import { RenderPriority, SyncRenderQueue } from "@typed/template/RenderQueue";

const diagnostics = html`<output>Ready</output>`;

const renderingServices = Layer.mergeAll(
  DomRenderTemplate,
  Layer.succeed(CurrentRenderQueue, new SyncRenderQueue()),
  Layer.succeed(CurrentRenderPriority, RenderPriority.Sync),
);

export const mountDiagnostics = (host: HTMLElement) =>
  Effect.scoped(render(diagnostics, host).pipe(Fx.drain, Effect.provide(renderingServices)));
```

`SyncRenderQueue` is useful for deterministic tests or deliberately immediate UI updates. It is not
automatically better for production: it can move work onto an interaction's call stack. For normal
browser rendering, `MixedRenderQueue` keeps visual work near a frame and lower-priority work in idle
time when those platform APIs exist.

## Choose a policy from measured behavior

Use `RenderPriority.Sync` for an update that must be visible in the same turn and whose cost is
known to be small. Use `Raf` for presentation work that can wait until the next frame; use `Idle`
only when the result is genuinely background work. Keep the decision close to the directive or
renderer extension that understands the interaction, and verify it with a browser measurement.

The queue does not make a large local collection update constant time, nor does it change the number
of DOM writes a template owns. It controls the start time of already-known work. For custom renderer
or directive authors, the [RenderQueue reference](/reference/modules/%40typed%2Ftemplate%2FRenderQueue) is the
public scheduling contract; ordinary template authors usually only need the default.

## Verify scheduling without visual guesswork

Use `SyncRenderQueue` in a focused DOM test when the assertion should observe a completed update
without waiting for an animation frame. Separately test a custom queue's replacement rule: add two
entries with the same key and priority, run the scheduler, and assert only the newest task ran and
the stale entry was disposed. Keep such tests about scheduling; use normal renderer tests to assert
text, properties, and ownership.
