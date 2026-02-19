import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Scope from "effect/Scope";
import * as ServiceMap from "effect/ServiceMap";
import * as SyncronizedRef from "effect/SynchronizedRef";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";
import type { FlatMapLike } from "./flatMap.js";

/**
 * Maps each element of an Fx to a new Fx, and switches to the latest inner Fx.
 *
 * When a new element is emitted, the previous inner Fx is cancelled.
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @returns An `Fx` that emits values from the latest inner stream.
 * @since 1.0.0
 * @category combinators
 */
export const switchMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    make<B, E | E2, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        const ctx = yield* Effect.services<R2 | Scope.Scope>();
        const scope = ServiceMap.get(ctx, Scope.Scope);
        const fiberRef = yield* SyncronizedRef.make<Fiber.Fiber<unknown, never> | null>(null);

        const next = (value: A) =>
          Effect.forkIn(Effect.provideServices(f(value).run(sink), ctx), scope, {
            startImmediately: false,
            uninterruptible: false,
          });

        yield* self.run(
          makeSink(sink.onFailure, (value: A) =>
            SyncronizedRef.updateEffect(fiberRef, (fiber) =>
              fiber ? Fiber.interrupt(fiber).pipe(Effect.flatMap(() => next(value))) : next(value),
            ),
          ),
        );

        const fiber = yield* SyncronizedRef.get(fiberRef);
        if (fiber) {
          yield* Fiber.join(fiber);
        }
      }, extendScope),
    ),
);
