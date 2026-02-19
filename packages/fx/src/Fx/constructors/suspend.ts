import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

export const suspend = <A, E, R>(fx: () => Fx<A, E, R>): Fx<A, E, R> =>
  make<A, E, R>((sink) => Effect.suspend(() => fx().run(sink)));
