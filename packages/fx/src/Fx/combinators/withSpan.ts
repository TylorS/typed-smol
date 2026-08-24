import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { SpanOptionsNoTrace } from "effect/Tracer";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { isFx } from "../TypeId.js";

/**
 * Wraps the stream run, and each sink callback, in a tracing span.
 *
 * @since 1.0.0
 * @category combinators
 */
export const withSpan: {
  (
    name: string,
    options?: SpanOptionsNoTrace,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, name: string, options?: SpanOptionsNoTrace): Fx<A, E, R>;
} = dual(
  (args) => isFx(args[0]),
  <A, E, R>(fx: Fx<A, E, R>, name: string, options?: SpanOptionsNoTrace): Fx<A, E, R> =>
    make<A, E, R>(<RSink>(sink: Sink<A, E, RSink>) =>
      Effect.withSpan(
        fx.run(
          makeSink(
            (cause) => Effect.withSpan(sink.onFailure(cause), `onFailure(${name})`, options),
            (value) => Effect.withSpan(sink.onSuccess(value), `onSuccess(${name})`, options),
          ),
        ),
        `Fx(${name})`,
        options,
      ),
    ),
);
