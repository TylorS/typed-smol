import { Duration, Effect, Scope } from "effect";
import { Fx } from "../Fx.js";
import { switchMap } from "./switchMap.js";
import { make } from "../constructors/make.js";
import { dual } from "effect/Function";

export const debounce: {
  (duration: Duration.Input): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope> =>
    switchMap(fx, (a) =>
      make(
        Effect.fn(function* (sink) {
          yield* Effect.sleep(duration);
          yield* sink.onSuccess(a);
        }),
      ),
    ),
);
