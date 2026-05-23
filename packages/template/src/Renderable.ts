// oxlint-disable typescript/no-redundant-type-constituents
// oxlint-disable typescript/no-duplicate-type-constituents

import type * as Effect from "effect/Effect";
import type * as Stream from "effect/Stream";
import type { Fx } from "@typed/fx";
import type { RefSubject } from "@typed/fx";
import type { EventHandler } from "./EventHandler.js";
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
  | Fx.Fx<A, E, R>;

export declare namespace Renderable {
  export type RefBinding<Element extends globalThis.Element = globalThis.Element, E = never, R = never> = (
    element: Element,
  ) => void | Effect.Effect<unknown, E, R>;

  /**
   * A type alias for any Renderable value with any error/context.
   */
  export type Any =
    | Renderable<any, any, any>
    | Renderable<any, never, never>
    | Renderable<never, any, any>
    | Renderable<never, never, any>
    | RefSubject.RefSubject<any, any, any>
    | RefSubject.Computed<any, any, any>
    | RefSubject.Filtered<any, any, any>
    | EventHandler<any, any, any>
    | RefBinding<any, any, any>;

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

  /**
   * Extracts the required services from a Renderable type.
   */
  export type Services<T> =
    | Fx.Services<T>
    | (T extends RefSubject.RefSubject<any, any, infer R> ? R : never)
    | (T extends RefSubject.Computed<any, any, infer R> ? R : never)
    | (T extends RefSubject.Filtered<any, any, infer R> ? R : never)
    | (T extends Stream.Stream<any, any, any> ? Stream.Services<T> : never)
    | (T extends EventHandler<any, any, infer R> ? R : never)
    | (T extends (...args: ReadonlyArray<any>) => infer Return ? Services<Return> : never)
    | Effect.Services<T>;

  /**
   * Extracts the error type from a Renderable type.
   */
  export type Error<T> =
    | Fx.Error<T>
    | (T extends RefSubject.RefSubject<any, infer E, any> ? E : never)
    | (T extends RefSubject.Computed<any, infer E, any> ? E : never)
    | (T extends RefSubject.Filtered<any, infer E, any> ? E : never)
    | (T extends Stream.Stream<any, any, any> ? Stream.Error<T> : never)
    | (T extends EventHandler<any, infer E, any> ? E : never)
    | (T extends (...args: ReadonlyArray<any>) => infer Return ? Error<Return> : never)
    | Effect.Error<T>;

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
      [K in keyof T]: T[K] extends (...args: Array<any>) => any
        ? Services<ReturnType<T[K]>>
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
      [K in keyof T]: T[K] extends (...args: Array<any>) => any
        ? Error<ReturnType<T[K]>>
        : Error<T[K]>;
    }[keyof T],
  ] extends [infer U]
    ? U
    : never;
}
