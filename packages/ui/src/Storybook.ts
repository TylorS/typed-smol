import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import {
  DomRenderTemplate,
  render as renderDom,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";

export interface MountedStory {
  readonly canvas: HTMLDivElement;
  readonly dispose: () => Promise<void>;
}

/**
 * Mounts a Typed component in an isolated Storybook canvas.
 *
 * The mount stays alive after its first render so reactive attributes and event
 * handlers remain attached. It is released explicitly or when Storybook
 * removes the canvas from its document.
 */
export async function mount<E>(
  content: Fx.Fx<RenderEvent, E, Scope.Scope | RenderTemplate>,
  document: Document = globalThis.document,
): Promise<MountedStory> {
  const canvas = document.createElement("div");
  const scope = Scope.makeUnsafe();
  const mounted = Deferred.makeUnsafe<void>();
  let disposed = false;
  let fiber: Fiber.Fiber<void, E> | undefined;

  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    if (fiber !== undefined) {
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
    await Effect.runPromise(Scope.close(scope, Exit.void));
  };

  fiber = Effect.runFork(
    Scope.provide(
      Fx.drain(
        renderDom(content, canvas).pipe(Fx.tap(() => Deferred.succeed(mounted, undefined))),
      ).pipe(Effect.provide(DomRenderTemplate.using(document))),
      scope,
    ),
  );

  await Effect.runPromise(Deferred.await(mounted));
  disposeWhenRemoved(canvas, document, dispose);
  return { canvas, dispose };
}

function disposeWhenRemoved(
  canvas: HTMLDivElement,
  document: Document,
  dispose: () => Promise<void>,
) {
  const MutationObserver = document.defaultView?.MutationObserver;
  if (MutationObserver === undefined) return;

  let connected = canvas.isConnected;
  const observer = new MutationObserver(() => {
    if (canvas.isConnected) {
      connected = true;
    } else if (connected) {
      observer.disconnect();
      void dispose();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
  queueMicrotask(() => {
    if (canvas.isConnected) connected = true;
  });
}
