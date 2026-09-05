---
title: "Schedule DOM rendering"
summary: "Change when local DOM work runs without changing what a template owns or how a dynamic part is updated."
section: "Template rendering"
kind: "deep-dive"
order: 7
---

A search producer can publish several result counts during one browser turn. Applying every
intermediate count may add presentation work without making any additional state visible. A render
queue lets already-known local updates wait for an appropriate execution time and coalesce where
their keys and priority agree.

Read [Direct updates, local reconciliation](/explore/dom-updates-and-reconciliation) first. The queue
controls when that work runs; it does not change the owned field, choose application concurrency,
or make a large range diff cheap.

## Keep publication separate from presentation

Imagine a count publishing `10`, `11`, and `12` before the next visual frame. If each pending update
uses the same queue key and priority, the newest replaces the earlier entry. The DOM can move from
its previous count directly to `12`. The source still published all three values; its business
Effects were not necessarily batched or canceled.

The queue entry contains a key, task, cleanup callback, and numeric priority. Cleanup releases
entry bookkeeping after execution or supersession. It should not undo the visual value immediately
after the task writes it.

```ts
import { MixedRenderQueue, RenderPriority } from "@typed/template/RenderQueue";

const output = document.createElement("output");
const queue = new MixedRenderQueue();

queue.add(
  output,
  () => { output.value = "12 results"; },
  () => { /* No additional pending-entry resources to release. */ },
  RenderPriority.Raf(5),
);
```

This lower-level example supplies an already-known output element as its key. A renderer does the
same kind of scheduling around its captured parts. Application components normally use the supplied
renderer policy rather than enqueue individual DOM mutations themselves.

## Choose priority by the interaction's requirement

`RenderPriority.Sync` is immediate work. `Raf(n)` expresses visual-frame work, and `Idle(n)` expresses
background work. Lower numeric priorities run first. Reusing a key at a *different* priority does
not automatically cancel its entry in another bucket; test that explicitly if an extension changes
priority dynamically.

Sync is useful when a small native update must be observable immediately, especially in deterministic
DOM tests. It can also move expensive work onto an interaction's call stack. Frame scheduling aligns
presentation work with a visual opportunity but cannot guarantee the callback will fit the frame
budget. Idle work must genuinely tolerate waiting.

A queue callback finishing does not mean layout or paint has completed. Measurements and focus
policies that require connection or geometry need their own platform coordination.

## Provide a policy at the rendering boundary

`CurrentRenderQueue` and `CurrentRenderPriority` are Effect services. An application or renderer
integration can provide them alongside the DOM target without coupling every component to a global
scheduler:

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { CurrentRenderPriority, CurrentRenderQueue } from "@typed/template/Render";
import { RenderPriority, SyncRenderQueue } from "@typed/template/RenderQueue";

const view = html`<output>Search ready</output>`;
const services = Layer.mergeAll(
  DomRenderTemplate,
  Layer.succeed(CurrentRenderQueue, new SyncRenderQueue()),
  Layer.succeed(CurrentRenderPriority, RenderPriority.Sync),
);

export const mountForTest = (host: HTMLElement) => view.pipe(
  render(host),
  Fx.drain,
  Effect.provide(services),
  Effect.scoped,
);
```

The renderer still owns the callbacks scheduled for its parts and disposes them with their scope.
The queue owns its active scheduler and pending buckets. Disposing a queue cancels that scheduler
and drops pending work; it is not a general teardown operation for already-rendered output.
A returned entry Disposable can cancel pending work at the lower-level API boundary.

## Test the scheduling decision rather than a guessed delay

For a captured-field assertion, a sync policy removes frame timing from the test. Test a custom
coalescing queue separately: add two tasks with the same key/priority, advance its scheduler,
assert only the newest runs, and assert the superseded cleanup happens. Also test cancellation and
same-key/different-priority behavior if an extension relies on them.

In a performance trace, separate producer computation, time waiting in the queue, mutation callback
execution, and browser layout/paint. If the producer rebuilds a thousand result records, changing
queue policy does not eliminate that computation. If a local range change triggers expensive
layout, delaying it does not make it scalar.

Use the [RenderQueue reference](/reference/modules/%40typed%2Ftemplate%2FRenderQueue) when building
a scheduler or directive. Keep ordinary UI state and event concurrency in the producing application;
[Native events with Effect](/explore/native-events-with-effect) describes that distinct boundary.
