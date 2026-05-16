import { dual } from "effect/Function";
import { Fx } from "../Fx.js";
import { Duration, Effect } from "effect";
import { mapEffect } from "./mapEffect.js";

export const delay: {
  (duration: Duration.Input): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input) =>
  mapEffect(self, (a) => Effect.as(Effect.sleep(duration), a)),
);
