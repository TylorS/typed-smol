import type * as Cause from "effect/Cause";
import type { Scope } from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import type { RenderEvent } from "./RenderEvent.js";
import type { RenderTemplate } from "./RenderTemplate.js";

export const ManyTypeId = Symbol.for("@typed/template/Many");
export type ManyTypeId = typeof ManyTypeId;

export interface Many<A, E, R> {
  readonly [ManyTypeId]: ManyTypeId;
  readonly values: Fx.Fx<ReadonlyArray<A>, E, R>;
  readonly getKey: (value: A) => PropertyKey;
  readonly render: (value: RefSubject.RefSubject<A>, key: PropertyKey) => Fx.Fx<RenderEvent, E, R>;
}

export function isMany(value: unknown): value is Many<any, any, any> {
  return typeof value === "object" && value !== null && ManyTypeId in value;
}

/**
 * Efficiently renders a reactive list of items by using keys to minimize DOM operations and maintain component state.
 *
 * `many` returns a renderer descriptor rather than an `Fx`. The active renderer
 * consumes its source directly and can therefore retain keyed entries without
 * flattening each child back through a generic collection stream.
 *
 * @remarks
 * ## Why
 *
 * Keys turn collection identity into a local rendering contract. The DOM
 * renderer keeps one entry map for the dynamic range: a new key starts one
 * child, a removed key closes one child Scope, a retained changed value updates
 * that child's `RefSubject`, and a pure reorder does not publish unchanged item
 * data. The same descriptor lets the HTML renderer serialize the first array in
 * source order and emit compatible hydration markers.
 *
 * ## Ownership and lifetime
 *
 * Each DOM key owns a forked child Scope. Removing the key closes that Scope;
 * interruption closes every remaining child. Both DOM and HTML rendering reject
 * duplicate keys with `Cause.IllegalArgumentError`. Hydratable output also
 * rejects local symbols because their identity cannot survive serialization;
 * use strings, numbers, or `Symbol.for()` keys across the server boundary.
 *
 * ## Cost model and moves
 *
 * Every source array requires O(n) key validation and ordering work; `many` does
 * not pretend an arbitrary list change is O(1). Within that pass, retained-key
 * lookup is O(1) on average, unchanged values skip `RefSubject.set`, and only
 * added or removed keys allocate or close child Scopes. DOM reconciliation is
 * confined to this range and uses equal-edge, append/remove, and reverse-swap
 * fast paths before an O(n) map fallback. An already-connected node is moved
 * with `ParentNode.moveBefore` when supported, preserving browser-managed state;
 * `insertBefore` is the compatibility fallback. HTML setup is O(n) for the
 * initial array and performs no live DOM reconciliation.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Fx, RefSubject } from "@typed/fx"
 * import { html, many } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 *
 * interface Todo {
 *   readonly id: string
 *   readonly text: string
 *   readonly completed: boolean
 * }
 *
 * const program = Effect.gen(function* () {
 *   const todos = yield* RefSubject.make<Todo[]>([
 *     { id: "1", text: "Learn Effect", completed: false },
 *     { id: "2", text: "Build app", completed: false }
 *   ])
 *
 *   const todoList = many(
 *     todos,
 *     (todo) => todo.id, // Key function
 *     (todoRef, key) => // Render function receives RefSubject
 *       html`<li>
 *         ${RefSubject.map(todoRef, (todo) => todo.text)}
 *         <button onclick=${RefSubject.update(todoRef, (todo) =>
 *           ({ ...todo, completed: !todo.completed })
 *         )}>Toggle</button>
 *       </li>`
 *   )
 *
 *   const template = html`<ul>${todoList}</ul>`
 *
 *   return yield* render(template, document.body).pipe(
 *     Fx.drainLayer,
 *     Layer.provide(DomRenderTemplate),
 *     Layer.launch
 *   )
 * })
 * ```
 *
 * @since 1.0.0
 * @category rendering
 */
export function many<A, E, R, B extends PropertyKey, R2, E2>(
  values: Fx.Fx<ReadonlyArray<A>, E, R>,
  getKey: (a: A) => B,
  render: (value: RefSubject.RefSubject<A>, key: B) => Fx.Fx<RenderEvent, E2, R2 | Scope>,
): Many<A, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope | RenderTemplate> {
  return {
    [ManyTypeId]: ManyTypeId,
    values,
    getKey,
    render: (value, key) => render(value, key as B),
  };
}

/**
 * Produces the legacy closing marker for an already encoded keyed-list hole.
 *
 * @remarks
 * ## Why
 *
 * The helper remains published for renderer and hydration compatibility. New
 * SSR output uses the versioned, escaped marker encoding implemented by `many`;
 * application code should not parse or synthesize hydration markers itself.
 *
 * ## Ownership and lifetime
 *
 * This pure formatter owns no DOM node, list item, or Scope.
 *
 * @example
 * ```ts
 * import { MANY_HOLE } from "@typed/template/many"
 *
 * const marker = MANY_HOLE("item-1")
 * ```
 *
 * @since 1.0.0
 * @category advanced
 */
export const MANY_HOLE = (key: PropertyKey): string => `<!--/m_${key.toString()}-->`;
