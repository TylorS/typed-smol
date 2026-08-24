import * as Effect from "effect/Effect";
import type * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import * as FxRuntime from "@typed/fx/Fx";
import { render } from "@typed/template/Render";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { Attachment } from "svelte/attachments";

/**
 * Renders a Typed view into a Svelte element for the lifetime of an attachment.
 *
 * The caller owns the ManagedRuntime. Attachment cleanup interrupts only this
 * render fiber and never disposes the runtime.
 */
export function attachment<A extends RenderEvent | null, E, R, ER>(
  runtime: ManagedRuntime.ManagedRuntime<Exclude<R, Scope.Scope>, ER>,
  view: Fx<A, E, R>,
): Attachment<HTMLElement> {
  return (element) => {
    const fiber = runtime.runFork(render(view, element).pipe(FxRuntime.drain, Effect.scoped));

    return () => fiber.interruptUnsafe();
  };
}
