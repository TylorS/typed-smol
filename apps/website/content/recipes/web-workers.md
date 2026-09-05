---
slug: web-workers
title: Compute in a browser Worker and render with Typed
summary: Move a CPU-bound summary off the UI thread while keeping messages, worker ownership, and cleanup explicit.
---

A large numeric summary should not block typing in the page. A dedicated Worker computes; Typed renders its progress or result on the main thread. The worker never receives template nodes, Effect services, or a RefSubject. Its boundary is structured-cloneable messages.

This example computes a sum for one selected dataset. Use it when the computation is large enough to justify worker startup and message costs. Ordinary I/O such as `fetch` does not need a worker simply to be asynchronous.

## Give one run one worker

The adapter takes a worker factory and numeric input. Each subscription owns a dedicated worker and terminates it on interruption. A request that supersedes this one should interrupt its subscription; a separate worker per run avoids accidentally rendering a late result from the previous dataset.

```ts
import { Data, Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";

class WorkerFailure extends Data.TaggedError("WorkerFailure")<{
  readonly message: string;
}> {}

export const summarize = (createWorker: () => Worker, values: ReadonlyArray<number>) =>
  Fx.callback<number, WorkerFailure>((emit) => {
    const worker = createWorker();
    const onMessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "number" || !Number.isFinite(event.data)) {
        emit.fail(new WorkerFailure({ message: "Invalid summary response" }));
        return;
      }
      emit.succeed(event.data);
    };
    const onError = (event: ErrorEvent) => {
      emit.fail(new WorkerFailure({ message: event.message }));
    };
    const onMessageError = () => {
      emit.fail(new WorkerFailure({ message: "Summary could not be deserialized" }));
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    worker.postMessage(values);
    return Effect.sync(() => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
      worker.terminate();
    });
  }).pipe(Fx.take(1));

const createSummaryWorker = () =>
  new Worker(new URL("./summary.worker.ts", import.meta.url), { type: "module" });

export const Summary =
  html`<output>Dataset total: ${summarize(createSummaryWorker, [10, 20, 30])}</output>`;
```

`Fx.take(1)` finishes after the first delivered result; it also releases the worker. The input adapter is lazy: declaring `Summary` starts no computation. Expected worker execution and message errors are typed failures. Invalid worker construction, such as a malformed URL or denied script, is a setup exception; handle that at an application error boundary if your deployment can produce it.

## Implement the other side of the protocol

Save this as the worker entry, for example `summary.worker.ts`. It checks incoming data instead of trusting TypeScript annotations across a message boundary.

```ts
self.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!Array.isArray(event.data) ||
      !event.data.every((value: unknown) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Expected finite numbers");
  }
  self.postMessage(event.data.reduce((total: number, value: number) => total + value, 0));
});
```

The browser entry above uses Vite's statically analyzable `new Worker(new URL(..., import.meta.url), { type: "module" })` form. Keep the worker file alongside that entry or adjust the relative path. Passing a factory preserves that syntax at the call site while the adapter still owns creating and terminating the worker. See [Vite worker imports](https://vite.dev/guide/features#web-workers).

## Decide when to reuse a worker

For repeated small requests, a persistent worker can amortize startup. That is a different ownership contract: the application owns termination, each request owns only its listener, and every request/response needs an ID. A cancelled request removes its listener; terminating the shared worker would cancel unrelated work. For large typed arrays, consider transfer lists, remembering that transferring an ArrayBuffer detaches it from the sender. See [Worker messaging](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage).

## Check cancellation and delivery

Test a known input, a malformed response, and worker script failure. Start a slow job, replace it, and verify the old result cannot overwrite the new selection. In a real browser, remove the summary while it computes and verify termination. Measure main-thread responsiveness and end-to-end latency with realistic payloads; a faster loop in isolation does not measure worker startup or cloning cost. Continue with [callback sources](/explore/building-fx) and the [Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Worker).
