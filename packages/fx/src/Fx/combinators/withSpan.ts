import * as Effect from "effect/Effect"
import type { SpanOptionsNoTrace } from "effect/Tracer"
import { make as makeSink, type Sink } from "../../Sink/Sink.js"
import { make } from "../constructors/make.js"
import type { Fx } from "../Fx.js"

export const withSpan = <A, E, R>(fx: Fx<A, E, R>, name: string, options?: SpanOptionsNoTrace): Fx<A, E, R> => {
  return make<A, E, R>(<RSink>(sink: Sink<A, E, RSink>) =>
    Effect.withSpan(
      fx.run(makeSink(
        (cause) => Effect.withSpan(sink.onFailure(cause), `onFailure(${name})`, options),
        (value) => Effect.withSpan(sink.onSuccess(value), `onSuccess(${name})`, options)
      )),
      `Fx(${name})`,
      options
    )
  )
}
