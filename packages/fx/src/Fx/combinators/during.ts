import { identity, Scope } from "effect";
import { Fx } from "../Fx.js";
import { multicast } from "../../Subject.js";
import { take } from "./take.js";
import { switchMap } from "./switchMap.js";
import { since } from "./since.js";
import { until } from "./until.js";

export function during<A, E, R, Start extends Fx.Any, E2, R2>(
  events: Fx<A, E, R>,
  signals: Fx<Start, E2, R2>,
): Fx<A, E | E2 | Fx.Error<Start>, R | R2 | Fx.Services<Start> | Scope.Scope> {
  const signalsMulticast = multicast(signals);
  const startSignal = take(signalsMulticast, 1); // When we emit the inner stream we start taking events
  const endSignal = take(switchMap(signalsMulticast, identity), 1); // Stop when the inner stream emits

  return events.pipe(since(startSignal), until(endSignal));
}
