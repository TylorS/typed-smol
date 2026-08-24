import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx/Fx";
import * as FxRuntime from "@typed/fx/Fx";

export type Source<A, E = never, R = never> =
  | A
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx<A, E, R>;

export function toFx<A, E, R>(source: Source<A, E, R>): Fx<A, E, R> {
  if (FxRuntime.isFx(source)) return source;
  if (Effect.isEffect(source)) return FxRuntime.fromEffect(source);
  if (Stream.isStream(source)) return FxRuntime.fromStream(source);
  return FxRuntime.succeed(source) as Fx<A, E, R>;
}
