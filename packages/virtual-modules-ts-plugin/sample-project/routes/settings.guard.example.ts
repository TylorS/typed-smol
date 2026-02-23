import * as Effect from "effect";
import * as Option from "effect/Option";

export const guard = (): Effect.Effect<Option.Option<unknown>> => Effect.succeed(Option.none());
