import type * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";

const TypeId = Symbol.for("@typed/astro/Component");

/** Astro owns slot markup; Typed borrows each slot as an opaque rendered node. */
export type Slots = Readonly<Record<string, Fx.Fx<RenderEvent> | undefined>>;

/** Services provided separately for each server render or browser island. */
export type Services = Scope | RenderTemplate;

/** A template, optionally acquired within the island's Scope. */
export type View<E = never> =
  | Fx.Fx<RenderEvent, E, Services>
  | Effect.Effect<Fx.Fx<RenderEvent, E, Services>, E, Services>;

/** An explicitly branded Typed component that Astro can recognize without running it. */
export interface Component<Props, E = never> {
  (props: Props, slots: Slots): View<E>;
  readonly [TypeId]: true;
}

/** Provide application services inside the callback; only rendering and Scope are built in. */
export function make<Props, E = never>(
  render: (props: Props, slots: Slots) => View<E>,
): Component<Props, E> {
  return Object.assign(render, { [TypeId]: true as const });
}

/** Checks the brand without invoking a foreign framework's component. */
export function isComponent(value: unknown): value is Component<Record<string, unknown>, unknown> {
  return typeof value === "function" && TypeId in value && value[TypeId] === true;
}
