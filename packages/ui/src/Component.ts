import type * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { liftRenderableToFx, type Renderable } from "@typed/template";

type ComponentFx<Yield extends Effect.Effect<any, any, any>, Result extends Renderable.Any> = [
  Fx.Fx<
    Renderable.Success<Result>,
    Effect.Error<Yield> | Renderable.Error<Result>,
    Effect.Services<Yield> | Renderable.Services<Result>
  >,
] extends [Fx.Fx<infer Success, infer Error, infer Services>]
  ? Fx.Fx<Success, Error, Services>
  : never;

type ComponentResult<Args extends ReadonlyArray<any>, Result> = Args extends readonly []
  ? Result
  : (...args: Args) => Result;

/**
 * @since 1.0.0
 * @category models
 */
export namespace component {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Gen = {
    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
    ): ComponentResult<Args, ComponentFx<Yield, Result>>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
    ): ComponentResult<Args, A>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
    ): ComponentResult<Args, B>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
    ): ComponentResult<Args, C>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
    ): ComponentResult<Args, D>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
    ): ComponentResult<Args, E>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
    ): ComponentResult<Args, F>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
    ): ComponentResult<Args, G>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
    ): ComponentResult<Args, H>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
      i: (_: H, ...args: Args) => I,
    ): ComponentResult<Args, I>;

    <
      Args extends ReadonlyArray<any>,
      Yield extends Effect.Effect<any, any, any>,
      const Result extends Renderable.Any,
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H,
      I,
      J,
    >(
      body: (...args: Args) => Generator<Yield, Result, any>,
      a: (_: ComponentFx<Yield, Result>, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C,
      d: (_: C, ...args: Args) => D,
      e: (_: D, ...args: Args) => E,
      f: (_: E, ...args: Args) => F,
      g: (_: F, ...args: Args) => G,
      h: (_: G, ...args: Args) => H,
      i: (_: H, ...args: Args) => I,
      j: (_: I, ...args: Args) => J,
    ): ComponentResult<Args, J>;
  };
}

/**
 * Creates an Fx component from a generator that may return any Renderable. A
 * zero-arity generator creates an Fx directly; generators with parameters
 * create an Fx function. Additional functions are piped over the generated Fx
 * using the same argument-forwarding behavior as Fx.fn.
 *
 * @since 1.0.0
 * @category constructors
 */
export const component: component.Gen = function (
  body: (...args: ReadonlyArray<any>) => Generator<Effect.Effect<any, any, any>, Renderable.Any, any>,
  ...pipeables: ReadonlyArray<Function>
): any {
  if (body.length === 0) {
    let result: any = Fx.gen(function* () {
      const renderable = yield* body();
      return liftRenderableToFx(renderable);
    });

    for (const pipeable of pipeables) {
      result = pipeable(result);
    }

    return result;
  }

  return (Fx.fn as (...args: ReadonlyArray<any>) => any)(
    function* (...args: ReadonlyArray<any>) {
      const renderable = yield* body(...args);
      return liftRenderableToFx(renderable);
    },
    ...pipeables,
  );
};
