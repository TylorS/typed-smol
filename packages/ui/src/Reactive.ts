import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Stream from "effect/Stream";
import { RefSubject } from "@typed/fx";
import type { Fx } from "@typed/fx/Fx";
import type { Renderable, RenderEvent, RenderTemplate } from "@typed/template";

export type Ref<A, E = never, R = never> =
  | RefSubject.RefSubject<A, E, R>
  | RefSubject.Computed<A, E, R>;

export type Value<A, E = never, R = never> =
  | Ref<A, E, R>
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

export function makeRef<A, E, R>(
  value: Value<A, E, R>,
): Effect.Effect<RefSubject.Computed<A, E, R>, never, R | Scope.Scope>;
export function makeRef<A, E, R>(
  value: Value<A, E, R>,
): Effect.Effect<RefSubject.Computed<A, E, R>, never, R | Scope.Scope> {
  return RefSubject.isComputed(value) ? Effect.succeed(value) : RefSubject.make(value);
}
