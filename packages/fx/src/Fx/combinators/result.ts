import * as Cause from "effect/Cause";
import * as Result from "effect/Result";
import type { Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Materializes success and failure of an Fx as `Result` values.
 *
 * - **Success**: each emitted value is wrapped as `Result.succeed(value)`.
 * - **Failure**: any failure (including typed error, defect, and interrupt) is
 *   materialized as `Result.fail(cause)`. The output error type is `Cause<E>`,
 *   so defects and interrupts are explicitly represented in the `Result` and
 *   the resulting Fx has error type `never`.
 *
 * The resulting Fx never fails at the stream level; all outcomes are emitted as
 * `Result<A, Cause<E>>`. Consumers can use `Result.match` or `Result.isSuccess` /
 * `Result.isFailure` to handle success vs failure (including defect/interrupt).
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` emitting `Result<A, Cause<E>>`.
 * @since 1.0.0
 * @category combinators
 */
export const result = <A, E, R>(fx: Fx<A, E, R>): Fx<Result.Result<A, Cause.Cause<E>>, never, R> =>
  make<Result.Result<A, Cause.Cause<E>>, never, R>((sink) => fx.run(new ResultSink(sink)));

class ResultSink<A, E, R> implements Sink<A, E, R> {
  readonly sink: Sink<Result.Result<A, Cause.Cause<E>>, never, R>;
  readonly onSuccess: (value: A) => import("effect/Effect").Effect<unknown, never, R>;
  readonly onFailure: (cause: Cause.Cause<E>) => import("effect/Effect").Effect<unknown, never, R>;

  constructor(sink: Sink<Result.Result<A, Cause.Cause<E>>, never, R>) {
    this.sink = sink;
    const s = sink;
    this.onSuccess = (value) => s.onSuccess(Result.succeed(value));
    this.onFailure = (cause) => s.onSuccess(Result.fail(cause));
  }
}
