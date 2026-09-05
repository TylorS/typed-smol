import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Exit from "effect/Exit";
import * as Fx from "@typed/fx/Fx";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import * as Component from "./Component.js";

interface Mounted {
  readonly fiber: Fiber.Fiber<never, unknown>;
  readonly unmount: () => void;
}

const mounted = new WeakMap<HTMLElement, Mounted>();
const revisions = new WeakMap<HTMLElement, number>();
const initializedSlots = new WeakSet<HTMLElement>();

/** Adopt only this island's slots; nested islands keep their own renderer ownership. */
function slotsFromAstro(element: HTMLElement, slots: Record<string, string>): Component.Slots {
  const existing = Array.from(element.querySelectorAll<HTMLElement>("astro-slot")).filter(
    (slot) => slot.closest("astro-island") === element || !slot.closest("astro-island"),
  );
  const initialized = initializedSlots.has(element);
  initializedSlots.add(element);
  return Object.fromEntries(
    Object.entries(slots).map(([name, content]) => {
      let slot = existing.find((node) => (node.getAttribute("name") ?? "default") === name);
      if (!slot) {
        slot = element.ownerDocument.createElement("astro-slot");
        if (name !== "default") slot.setAttribute("name", name);
        // Only Astro's trusted slot transport crosses this HTML boundary, never component props.
        slot.innerHTML = content;
      } else if (initialized && slot.innerHTML !== content) {
        // Astro reserializes live child DOM on parent updates. Only replace content that differs.
        slot.innerHTML = content;
      }
      return [name, Fx.succeed(DomRenderEvent(slot))];
    }),
  );
}

/**
 * Creates Astro's browser renderer for one island element.
 * Replacement waits for the previous render's interruption; astro:unmount ends
 * its subscriptions. Setup failures reject hydration, while later failures are
 * reported by typed:error on the island. Astro invokes this renderer entry.
 *
 * @since 1.0.0
 * @category Hydration and lifecycle
 */
export default (element: HTMLElement) =>
  async (
    component: unknown,
    props: Record<string, unknown>,
    slots: Record<string, string> = {},
    { client }: { client: string } = { client: "load" },
  ): Promise<void> => {
    if (!Component.isComponent(component)) {
      throw new TypeError("@typed/astro requires a component created with component");
    }
    const revision = (revisions.get(element) ?? 0) + 1;
    revisions.set(element, revision);
    const previous = mounted.get(element);
    if (previous) {
      await Effect.runPromise(Fiber.interrupt(previous.fiber));
      element.removeEventListener("astro:unmount", previous.unmount);
    }
    if (revisions.get(element) !== revision) return;
    if (client === "only") element.replaceChildren();
    const children = slotsFromAstro(element, slots);
    let ready = false;
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    const fiber = Effect.runFork(
      Effect.suspend(() =>
        render(Component.view(component, props, children), element).pipe(
          Fx.provide(DomRenderTemplate.using(element.ownerDocument)),
          Fx.observe(() => {
            ready = true;
            resolve();
          }),
          Effect.andThen(
            Effect.suspend(() =>
              ready
                ? Effect.never
                : Effect.die(new Error("Typed component completed without rendering")),
            ),
          ),
          Effect.scoped,
        ),
      ),
    );
    const unmount = () => {
      revisions.set(element, (revisions.get(element) ?? revision) + 1);
      void Effect.runPromise(Fiber.interrupt(fiber));
    };
    mounted.set(element, { fiber, unmount });
    element.addEventListener("astro:unmount", unmount, { once: true });
    fiber.addObserver((exit) => {
      if (Exit.isFailure(exit)) {
        if (!ready) reject(exit.cause);
        else if (mounted.get(element)?.fiber === fiber && revisions.get(element) === revision) {
          element.dispatchEvent(new CustomEvent("typed:error", { detail: exit.cause }));
        }
      }
      if (mounted.get(element)?.fiber === fiber) {
        mounted.delete(element);
        element.removeEventListener("astro:unmount", unmount);
      }
    });
    await promise;
  };
