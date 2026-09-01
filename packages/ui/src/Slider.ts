import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Current renderer-independent slider value.
 * @remarks
 * ## Why
 * Value logic remains testable without mounting a range input.
 * ## Ownership and lifetime
 * Plain state is resource-free; RefSubject ownership is Scope-based.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Finite value reflected by the native input.
   * @remarks
   * ## Why
   * A single numeric source prevents state and DOM drift.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Initial slider value.
 * @remarks
 * ## Why
 * Explicit state gives SSR and hydration the same numeric snapshot.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category state
 */
export interface InitialState {
  /** Finite initial value.
   * @remarks
   * ## Why
   * It seeds the synchronized input state.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Schema for slider hydration state.
 * @remarks
 * ## Why
 * Finite validation prevents invalid serialized range values.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({ value: Schema.Finite });

/** Creates hydrated slider state.
 * @remarks
 * ## Why
 * State can be composed and tested independently of the renderer.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Slider from "@typed/ui/Slider"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Slider.makeState({ value: 50 })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/** Updates the synchronized slider value.
 * @remarks
 * ## Why
 * An explicit Effect transition preserves RefSubject failures and services.
 * ## Ownership and lifetime
 * It uses the existing state lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Slider from "@typed/ui/Slider"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Slider.makeState({ value: 25 })
 *   yield* Slider.setValue(state, 50)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function setValue<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  value: number,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, value }));
}

/** Options for a native range input.
 * @remarks
 * ## Why
 * Native range semantics provide keyboard and accessibility behavior while
 * Typed synchronizes renderer-independent state.
 * ## Ownership and lifetime
 * Options are inert; the mounted component owns subscriptions by Scope.
 * @since 1.0.0
 * @category models
 */
export interface SliderOptions extends Dom.HostOptions<HTMLInputElement> {
  /** Hydrated state synchronized to the input.
   * @remarks
   * ## Why
   * One source serves SSR, UI, and state-only tests.
   * ## Ownership and lifetime
   * The component borrows state and subscribes only while mounted.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Native minimum value.
   * @remarks
   * ## Why
   * The platform uses this bound for keyboard and constraint behavior.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly min?: Renderable.Any<number | null | undefined>;
  /** Native maximum value.
   * @remarks
   * ## Why
   * The platform uses this bound for keyboard and constraint behavior.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly max?: Renderable.Any<number | null | undefined>;
  /** Native step value or `"any"`.
   * @remarks
   * ## Why
   * Step semantics remain delegated to the input element.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly step?: Renderable.Any<number | "any" | null | undefined>;
}

function internalProps<const Options extends SliderOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "range",
      value: RefSubject.map(options.state, (state) => state.value),
      ".value": RefSubject.map(options.state, (state) => String(state.value)),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      oninput: EventHandler.make(
        Effect.fn((event: Event) =>
          setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
        ),
      ),
      ref: options.state,
    }) as const;
}
type SliderInternalProps<Options extends SliderOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a native range input synchronized with hydrated state.
 * @remarks
 * ## Why
 * Browser pointer, keyboard, constraints, and accessibility remain intact;
 * input events update the same RefSubject consumed elsewhere.
 * ## Ownership and lifetime
 * Running the Fx owns native listeners and subscriptions in its Scope. A
 * custom host must preserve type, value, range props, and the hydration ref.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Slider from "@typed/ui/Slider"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Slider.makeState({ value: 50 })
 *   return Slider.Slider({ state, min: 0, max: 100 })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Slider<const Options extends SliderOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SliderInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SliderInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
