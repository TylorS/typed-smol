import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx/Fx";
import type { Renderable, RenderEvent, RenderTemplate } from "@typed/template";

export type Value<A, E = never, R = never> =
  | Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A;

export type Content<A = unknown, E = any, R = any> = Renderable<A, E, R>;

export type Component<Opts extends {}, A = RenderEvent> = Fx<
  A,
  Renderable.ErrorFromObject<Opts>,
  Renderable.ServicesFromObject<Opts> | Scope.Scope | RenderTemplate
>;
