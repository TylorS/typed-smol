import type { NonEmptyReadonlyArray } from "effect/Array";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

const sizeOf = (n: number): number => Math.max(1, Math.floor(n));

/**
 * Partitions the stream into non-empty arrays of size `n`. The final array
 * may be smaller if there are leftover elements.
 *
 * Matches Effect `Stream.grouped`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const grouped: {
  (
    n: number,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<NonEmptyReadonlyArray<A>, E, R>;
  <A, E, R>(self: Fx<A, E, R>, n: number): Fx<NonEmptyReadonlyArray<A>, E, R>;
} = dual(
  2,
  <A, E, R>(self: Fx<A, E, R>, n: number): Fx<NonEmptyReadonlyArray<A>, E, R> => {
    const size = sizeOf(n);
    return make<NonEmptyReadonlyArray<A>, E, R>((sink) =>
      Effect.gen(function* () {
        const buffer: Array<A> = [];
        yield* self.run(
          makeSink(sink.onFailure, (a: A) => {
            buffer.push(a);
            if (buffer.length >= size) {
              const group = buffer.splice(0, size) as unknown as NonEmptyReadonlyArray<A>;
              return sink.onSuccess(group);
            }
            return Effect.void;
          }),
        );
        if (buffer.length > 0) {
          yield* sink.onSuccess(buffer as unknown as NonEmptyReadonlyArray<A>);
        }
      }),
    );
  },
);

/**
 * Partitions the stream into arrays, emitting when `n` is reached or `duration`
 * elapses after the first element of the current group.
 *
 * Matches Effect `Stream.groupedWithin`.
 *
 * @since 1.0.0
 * @category combinators
 */
export const groupedWithin: {
  (
    n: number,
    duration: Duration.Input,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<NonEmptyReadonlyArray<A>, E, R | Scope.Scope>;
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
    duration: Duration.Input,
  ): Fx<NonEmptyReadonlyArray<A>, E, R | Scope.Scope>;
} = dual(
  3,
  <A, E, R>(
    self: Fx<A, E, R>,
    n: number,
    duration: Duration.Input,
  ): Fx<NonEmptyReadonlyArray<A>, E, R | Scope.Scope> => {
    const size = sizeOf(n);
    return make<NonEmptyReadonlyArray<A>, E, R | Scope.Scope>(
      Effect.fn(function* (sink) {
        const ctx = yield* Effect.context<Scope.Scope>();
        const scope = Context.get(ctx, Scope.Scope);
        const buffer = yield* Ref.make<Array<A>>([]);
        const timer = yield* Ref.make<Fiber.Fiber<void, never> | null>(null);

        const clearTimer = Effect.flatMap(Ref.getAndSet(timer, null), (fiber) =>
          fiber ? Fiber.interrupt(fiber) : Effect.void,
        );

        const emitBuffer = Effect.gen(function* () {
          const group = yield* Ref.getAndSet(buffer, []);
          if (group.length > 0) {
            yield* sink.onSuccess(group as unknown as NonEmptyReadonlyArray<A>);
          }
        });

        const flushNow = clearTimer.pipe(Effect.andThen(emitBuffer));
        const flushFromTimer = Ref.set(timer, null).pipe(Effect.andThen(emitBuffer));

        const arm = Effect.flatMap(
          Effect.forkIn(Effect.sleep(duration).pipe(Effect.andThen(flushFromTimer)), scope, {
            startImmediately: true,
            uninterruptible: false,
          }),
          (fiber) => Ref.set(timer, fiber),
        );

        yield* self.run(
          makeSink(sink.onFailure, (a: A) =>
            Effect.gen(function* () {
              const next = yield* Ref.updateAndGet(buffer, (current) => [...current, a]);
              if (next.length === 1) {
                yield* arm;
              }
              if (next.length >= size) {
                yield* flushNow;
              }
            }),
          ),
        );

        yield* flushNow;
      }, extendScope),
    );
  },
);
