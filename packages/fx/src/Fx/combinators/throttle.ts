import { Duration, Effect, Scope } from "effect";
import { Fx } from "../Fx.js";
import { exhaustMap } from "./exhaustMap.js";
import { make } from "../constructors/make.js";
import { dual } from "effect/Function";

export const throttle: {
  (duration: Duration.Input): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope> =>
    exhaustMap(fx, (a) =>
      make(
        Effect.fn(function* (sink) {
          yield* sink.onSuccess(a);
          yield* Effect.sleep(duration);
        }),
      ),
    ),
);
