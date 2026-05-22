import type * as Effect from "effect/Effect";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx/Fx";

export type RenderableValue<A, E = never, R = never> =
  | A
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx<A, E, R>;
