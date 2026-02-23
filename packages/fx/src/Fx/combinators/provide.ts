import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as ServiceMap from "effect/ServiceMap";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Provides context to an Fx from a Layer.
 *
 * The context is provided to the entire Fx stream, including any effects run
 * during its execution. The context is scoped to the lifetime of the stream.
 *
 * @param layer - The Layer to provide.
 * @returns An `Fx` with the required context provided.
 * @since 1.0.0
 * @category combinators
 */
export const provide: {
  <R2, E2 = never, R3 = never>(
    layer: Layer.Layer<R2, E2, R3>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, Exclude<R, R2> | R3>;

  <A, E, R, R2, E2 = never, R3 = never>(
    fx: Fx<A, E, R>,
    layer: Layer.Layer<R2, E2, R3>,
  ): Fx<A, E | E2, Exclude<R, R2> | R3>;
} = dual(
  2,
  <A, E, R, R2, E2 = never, R3 = never>(
    fx: Fx<A, E, R>,
    layer: Layer.Layer<R2, E2, R3>,
  ): Fx<A, E | E2, Exclude<R, R2> | R3> =>
    make<A, E | E2, Exclude<R, R2> | R3>(
      Effect.fnUntraced(function* (sink) {
        const scope = yield* Scope.make();
        const servicesExit = yield* layer.pipe(Layer.buildWithScope(scope), Effect.exit);

        if (Exit.isFailure(servicesExit)) {
          yield* Scope.close(scope, servicesExit);
          return yield* sink.onFailure(servicesExit.cause);
        }

        return yield* fx.run(sink).pipe(
          Effect.provideServices(servicesExit.value),
          Effect.onExit((exit) => Scope.close(scope, exit)),
        );
      }),
    ),
);

export const provideServices: {
  <R2>(services: ServiceMap.ServiceMap<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>;

  <A, E, R, R2>(fx: Fx<A, E, R>, services: ServiceMap.ServiceMap<R2>): Fx<A, E, Exclude<R, R2>>;
} = dual(
  2,
  <A, E, R, R2>(fx: Fx<A, E, R>, services: ServiceMap.ServiceMap<R2>): Fx<A, E, Exclude<R, R2>> =>
    provide(fx, Layer.succeedServices(services)),
);

/**
 * Provides a single service to an Fx.
 *
 * Equivalent to `provideServices(fx, ServiceMap.make(tag, service))`. The service
 * is available for the entire Fx stream, scoped to the stream lifetime.
 *
 * @param tag - The service tag (identifier).
 * @param service - The service implementation.
 * @returns An `Fx` with the required service provided.
 * @since 1.0.0
 * @category combinators
 */
export const provideService: {
  <Id, S>(
    tag: ServiceMap.Service<Id, S>,
    service: S,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, Id>>;
  <A, E, R, Id, S>(
    fx: Fx<A, E, R>,
    tag: ServiceMap.Service<Id, S>,
    service: S,
  ): Fx<A, E, Exclude<R, Id>>;
} = dual(
  3,
  <A, E, R, Id, S>(
    fx: Fx<A, E, R>,
    tag: ServiceMap.Service<Id, S>,
    service: S,
  ): Fx<A, E, Exclude<R, Id>> => provideServices(fx, ServiceMap.make(tag, service)),
);

/**
 * Provides a single service to an Fx by running an effect that produces the service.
 *
 * The effect is run when the Fx is run; the resulting service is provided to the
 * entire stream. Equivalent to `provide(fx, Layer.effect(tag, serviceEffect))`.
 *
 * @param tag - The service tag (identifier).
 * @param serviceEffect - Effect that produces the service (may have its own requirements).
 * @returns An `Fx` with the required service provided.
 * @since 1.0.0
 * @category combinators
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: ServiceMap.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, Exclude<R, Id> | R2>;
  <A, E, R, Id, S, E2, R2>(
    fx: Fx<A, E, R>,
    tag: ServiceMap.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): Fx<A, E | E2, Exclude<R, Id> | R2>;
} = dual(
  3,
  <A, E, R, Id, S, E2, R2>(
    fx: Fx<A, E, R>,
    tag: ServiceMap.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): Fx<A, E | E2, Exclude<R, Id> | R2> => provide(fx, Layer.effect(tag, serviceEffect)),
);
