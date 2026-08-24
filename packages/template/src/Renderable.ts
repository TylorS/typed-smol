// oxlint-disable typescript/no-redundant-type-constituents
// oxlint-disable typescript/no-duplicate-type-constituents

import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx";
import type { HydrationRef } from "@typed/fx/RefSubject";
import type * as EventHandler from "./EventHandler.js";
import type { RenderEvent } from "./RenderEvent.js";

/**
 * Represents any value that can be rendered into a template.
 *
 * This includes:
 * - Primitives (string, number, boolean, null, undefined)
 * - Arrays of Renderables
 * - Effects that produce a Renderable
 * - Streams (Fx or Stream) that emit Renderables
 * - Objects (typically for setting properties or attributes)
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html } from "@typed/template"
 * import { Fx } from "@typed/fx"
 * import * as RefSubject from "@typed/fx/RefSubject"
 *
 * // Primitives
 * const primitive = html`<div>${"Hello"}</div>`
 * const number = html`<div>${42}</div>`
 * const boolean = html`<div>${true}</div>`
 *
 * // Effects
 * const effect = html`<div>${Effect.succeed("Async value")}</div>`
 *
 * // Fx streams (reactive)
 * const count = yield* RefSubject.make(0)
 * const reactive = html`<div>Count: ${count}</div>`
 *
 * // Arrays
 * const items = [1, 2, 3]
 * const list = html`<ul>${items.map((n) => html`<li>${n}</li>`)}</ul>`
 *
 * // Objects (for attributes)
 * const withProps = html`<div .data=${{ foo: "bar" }}></div>`
 * ```
 *
 * @since 1.0.0
 * @category models
 */
export type Renderable<A, E = never, R = never> =
  | A
  | { readonly [key: string]: Renderable<unknown, E, R> } // TODO: How to better handle .data and ...spread attributes???
  | ReadonlyArray<Renderable<A, E, R>>
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx.Fx<A, E, R>
  | HydrationRef<E, R>;

export declare namespace Renderable {
  /**
   * A type alias for any Renderable value with any error/context.
   */
  export type Any<A = any> =
    | Renderable<A, any, any>
    | Renderable<A, never, never>
    | Renderable<never, any, any>
    | Renderable<never, never, any>;

  /**
   * The basic primitive types that can be rendered directly.
   */
  export type Primitive =
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | void
    | RenderEvent;

  export type Effects =
    | Effect.Effect<any, any, any>
    | Fx.Fx<any, any, any>
    | Stream.Stream<any, any, any>;

  /**
   * Extracts the required services from a Renderable type.
   */
  export type Services<T> = RenderableServices<T>;

  /**
   * Extracts the error type from a Renderable type.
   */
  export type Error<T> = RenderableError<T>;

  /**
   * Extracts the success type from a Renderable type.
   */
  export type Success<T> =
    | Fx.Success<T>
    | (T extends Stream.Stream<any, any, any> ? Stream.Success<T> : never)
    | Effect.Success<T>;

  // Helpers for arbitrary objects

  /**
   * Traverse all keys in an object and extract the services from each value. If
   * the value is a function, extract the services from the return type of the function.
   */
  export type ServicesFromObject<T> = [
    {
      [K in keyof T]-?: T[K] extends (...args: Array<any>) => any
        ? FunctionServices<ReturnType<T[K]>>
        : Services<T[K]>;
    }[keyof T],
  ] extends [infer U]
    ? U
    : never;

  /**
   * Traverse all keys in an object and extract the error from each value. If
   * the value is a function, extract the error from the return type of the function.
   */
  export type ErrorFromObject<T> = [
    {
      [K in keyof T]-?: T[K] extends (...args: Array<any>) => any
        ? FunctionError<ReturnType<T[K]>>
        : Error<T[K]>;
    }[keyof T],
  ] extends [infer U]
    ? U
    : never;
}

type RenderableServices<T> =
  IsAny<T> extends true ? any : T extends unknown ? RenderableServicesSingle<T> : never;

type RenderableServicesSingle<T> =
  | Fx.Services<T>
  | (T extends Stream.Stream<any, any, any> ? Stream.Services<T> : never)
  | Effect.Services<T>
  | (T extends HydrationRef<any, infer R> ? R : never)
  | EventHandler.Services<T>
  | NestedServices<T>;

type RenderableError<T> =
  IsAny<T> extends true ? any : T extends unknown ? RenderableErrorSingle<T> : never;

type RenderableErrorSingle<T> =
  | Fx.Error<T>
  | (T extends Stream.Stream<any, any, any> ? Stream.Error<T> : never)
  | Effect.Error<T>
  | (T extends HydrationRef<infer E, any> ? E : never)
  | EventHandler.Error<T>
  | NestedError<T>;

type NestedServices<T> = T extends
  | Renderable.Effects
  | Option.Option<any>
  | HydrationRef<any, any>
  | EventHandler.EventHandler<any, any, any>
  | AtomicObject
  ? never
  : T extends (...args: Array<any>) => infer U
    ? FunctionServices<U>
    : T extends ReadonlyArray<infer U>
      ? Renderable.Services<U>
      : T extends object
        ? Renderable.ServicesFromObject<T>
        : never;

type NestedError<T> = T extends
  | Renderable.Effects
  | Option.Option<any>
  | HydrationRef<any, any>
  | EventHandler.EventHandler<any, any, any>
  | AtomicObject
  ? never
  : T extends (...args: Array<any>) => infer U
    ? FunctionError<U>
    : T extends ReadonlyArray<infer U>
      ? Renderable.Error<U>
      : T extends object
        ? Renderable.ErrorFromObject<T>
        : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

type AtomicObject =
  | globalThis.Event
  | globalThis.EventTarget
  | globalThis.CSSRule
  | globalThis.CSSStyleDeclaration
  | globalThis.StyleSheet
  | Date
  | RegExp;

type FunctionServices<T> = T extends Renderable.Effects
  ? Renderable.Services<T>
  : T extends ReadonlyArray<infer U>
    ? FunctionServices<U>
    : never;

type FunctionError<T> = T extends Renderable.Effects
  ? Renderable.Error<T>
  : T extends ReadonlyArray<infer U>
    ? FunctionError<U>
    : never;
