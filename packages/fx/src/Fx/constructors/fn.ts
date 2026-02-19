import * as Effect from "effect/Effect"
import type { SpanOptionsNoTrace } from "effect/Tracer"
import type { unassigned } from "effect/Types"
import { unwrap } from "../combinators/unwrap.js"
import type { Fx } from "../Fx.js"
import { isFx } from "../TypeId.js"

/** Extract error type from Yieldable (Effect v4 has no Yieldable.Error) */
type _YieldableError<Y> = Y extends Effect.Yieldable<any, any, infer E, any> ? E : never
/** Extract services type from Yieldable (Effect v4 has no Yieldable.Services) */
type _YieldableServices<Y> = Y extends Effect.Yieldable<any, any, any, infer R> ? R : never

/**
 * @since 1.0.0
 * @category function
 */
export namespace fn {
  /**
   * @since 1.0.0
   * @category models
   */
  export type Gen = {
    <Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>
    ): (...args: Args) => Fx<
      Fx.Success<ReturnFx>,
      Fx.Error<ReturnFx> | _YieldableError<Eff>,
      Fx.Services<ReturnFx> | _YieldableServices<Eff>
    >
    <Self, Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>>(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>
    ): (
      this: Self,
      ...args: Args
    ) => Fx<
      Fx.Success<ReturnFx>,
      Fx.Error<ReturnFx> | _YieldableError<Eff>,
      Fx.Services<ReturnFx> | _YieldableServices<Eff>
    >

    <Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A
    ): (...args: Args) => A
    <Self, Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A>(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A
    ): (this: Self, ...args: Args) => A

    <Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A, B>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B
    ): (...args: Args) => B
    <Self, Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A, B>(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B
    ): (this: Self, ...args: Args) => B

    <Eff extends Effect.Yieldable<any, any, any, any>, ReturnFx extends Fx.Any, Args extends Array<any>, A, B, C>(
      body: (this: unassigned, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C
    ): (...args: Args) => C
    <
      Self,
      Eff extends Effect.Yieldable<any, any, any, any>,
      ReturnFx extends Fx.Any,
      Args extends Array<any>,
      A,
      B,
      C
    >(
      body: (this: Self, ...args: Args) => Generator<Eff, ReturnFx>,
      a: (
        _: Fx<
          Fx.Success<ReturnFx>,
          Fx.Error<ReturnFx> | _YieldableError<Eff>,
          Fx.Services<ReturnFx> | _YieldableServices<Eff>
        >,
        ...args: Args
      ) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C
    ): (this: Self, ...args: Args) => C
  }

  /**
   * @since 1.0.0
   * @category models
   */
  export type NonGen = {
    <Args extends Array<any>, ReturnFx extends Fx.Any>(
      body: (this: unassigned, ...args: Args) => ReturnFx
    ): (...args: Args) => ReturnFx
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any>(
      body: (this: Self, ...args: Args) => ReturnFx
    ): (this: Self, ...args: Args) => ReturnFx

    <Args extends Array<any>, ReturnFx extends Fx.Any, A>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A
    ): (...args: Args) => A
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A
    ): (this: Self, ...args: Args) => A

    <Args extends Array<any>, ReturnFx extends Fx.Any, A, B>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B
    ): (...args: Args) => B
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A, B>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B
    ): (this: Self, ...args: Args) => B

    <Args extends Array<any>, ReturnFx extends Fx.Any, A, B, C>(
      body: (this: unassigned, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C
    ): (...args: Args) => C
    <Self, Args extends Array<any>, ReturnFx extends Fx.Any, A, B, C>(
      body: (this: Self, ...args: Args) => ReturnFx,
      a: (_: ReturnFx, ...args: Args) => A,
      b: (_: A, ...args: Args) => B,
      c: (_: B, ...args: Args) => C
    ): (this: Self, ...args: Args) => C
  }
}

export const fn: fn.Gen & fn.NonGen & {
  (name: string, options?: SpanOptionsNoTrace): fn.Gen & fn.NonGen
} = function(...args: Array<any>): any {
  const [first, ...rest] = args

  if (typeof first === "string") {
    const fn_ = Effect.fn(first, ...rest)
    return (body: any, ...pipeables: Array<Function>) =>
      fn_(
        unwrapApply(body),
        unwrap,
        // @ts-expect-error - It's fine to be variadic
        ...pipeables
      )
  }

  return Effect.fn(
    unwrapApply(first),
    unwrap,
    // @ts-expect-error - It's fine to be variadic
    ...rest
  )
}

function unwrapApply(fn: Function) {
  return function(this: any, ...args: Array<any>) {
    const x = fn.apply(this, args)
    if (isFx(x)) return Effect.succeed(x)
    return x
  }
}
