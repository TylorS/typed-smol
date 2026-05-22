import * as Effect from "effect/Effect";
import type { Renderable } from "@typed/template";

export function toEffect<A, E, R>(
  value: Renderable<A, E, R>,
): Effect.Effect<A, E, R> {
  return Effect.isEffect(value) ? value : Effect.succeed(value as A);
}
