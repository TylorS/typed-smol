import type { Scope } from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import type { RenderEvent } from "./RenderEvent.js";

export const ManyTypeId = Symbol.for("@typed/template/Many");
export type ManyTypeId = typeof ManyTypeId;

export interface Many<A, E, R, B extends PropertyKey, E2, R2> {
  readonly [ManyTypeId]: ManyTypeId;
  readonly values: Fx.Fx<ReadonlyArray<A>, E, R>;
  readonly getKey: (value: A) => B;
  readonly render: (value: RefSubject.RefSubject<A>, key: B) => Fx.Fx<RenderEvent, E2, R2 | Scope>;
}

export function isMany(value: unknown): value is Many<any, any, any, PropertyKey, any, any> {
  return typeof value === "object" && value !== null && ManyTypeId in value;
}

/**
 * Efficiently renders a reactive list of items by using keys to minimize DOM operations and maintain component state.
 *
 * `many` optimizes list rendering by:
 * 1. **Keyed Diffing**: Uniquely identifies items using `getKey`. Components are only mounted when a new key appears and unmounted when a key disappears.
 * 2. **Granular Updates**: Instead of re-rendering the component when an item changes, `many` passes a `RefSubject<A>` to the `render` function.
 *    The component remains mounted, and the `RefSubject` emits the updated value, allowing the component to update only the changed parts of the DOM.
 *
 * This pattern is essential for performance when rendering lists where items may be reordered, added, removed, or modified in place.
 *
 * `many` returns a renderer descriptor rather than an `Fx`. The DOM renderer consumes
 * source changes directly, updates only changed item refs, and moves the minimum keyed
 * ranges needed to establish the new order. The HTML renderer consumes the same
 * descriptor to emit hydration markers for those keys.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { html, many } from "@typed/template"
 * import { DomRenderTemplate, render } from "@typed/template/Render"
 * import { Fx } from "@typed/fx"
 * import { Layer } from "effect"
 * import * as RefSubject from "@typed/fx/RefSubject"
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
 *   yield* render(template, document.body).pipe(
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
): Many<A, E, R, B, E2, R2> {
  return { [ManyTypeId]: ManyTypeId, values, getKey, render };
}

export const MANY_HOLE = (key: PropertyKey): string => `<!--/m_${key.toString()}-->`;
