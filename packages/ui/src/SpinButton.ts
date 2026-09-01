import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Current renderer-independent spin-button value.
 * @remarks
 * ## Why
 * Numeric state can be transformed and tested without an input element.
 * ## Ownership and lifetime
 * Plain state is resource-free; RefSubject ownership is Scope-based.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Finite value reflected by the native number input.
   * @remarks
   * ## Why
   * One source keeps form control and application state aligned.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Initial spin-button value.
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
   * It seeds synchronized state before the element mounts.
   * ## Ownership and lifetime
   * Plain data retains no resources.
   * @since 1.0.0
   * @category state
   */
  readonly value: number;
}

/** Schema for spin-button hydration state.
 * @remarks
 * ## Why
 * Finite validation prevents invalid serialized number values.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({ value: Schema.Finite });

/** Creates hydrated spin-button state.
 * @remarks
 * ## Why
 * State remains renderer-independent and directly testable.
 * ## Ownership and lifetime
 * The calling Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as SpinButton from "@typed/ui/SpinButton"
 *
 * const program = Effect.gen(function* () {
 *   return yield* SpinButton.makeState({ value: 3 })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, initial);
}

/** Updates the synchronized numeric value.
 * @remarks
 * ## Why
 * An explicit Effect transition preserves RefSubject errors and services.
 * ## Ownership and lifetime
 * It uses the existing state lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as SpinButton from "@typed/ui/SpinButton"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* SpinButton.makeState({ value: 1 })
 *   yield* SpinButton.setValue(state, 2)
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

/** Options for a native number input.
 * @remarks
 * ## Why
 * Native spin-button behavior supplies editing, stepping, forms, and
 * accessibility while Typed synchronizes state.
 * ## Ownership and lifetime
 * Options are inert; the mounted component owns subscriptions by Scope.
 * @since 1.0.0
 * @category models
 */
export interface SpinButtonOptions extends Dom.HostOptions<HTMLInputElement> {
  /** Hydrated value state.
   * @remarks
   * ## Why
   * One source serves SSR, UI, and renderer-free state logic.
   * ## Ownership and lifetime
   * The component borrows state and subscribes only while mounted.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Native minimum value.
   * @remarks
   * ## Why
   * The platform applies this bound to stepping and validation.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly min?: Renderable.Any<number | null | undefined>;
  /** Native maximum value.
   * @remarks
   * ## Why
   * The platform applies this bound to stepping and validation.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly max?: Renderable.Any<number | null | undefined>;
  /** Native step value or `"any"`.
   * @remarks
   * ## Why
   * Increment semantics remain delegated to the number input.
   * ## Ownership and lifetime
   * Dynamic attributes follow the component Scope.
   * @since 1.0.0
   * @category attributes
   */
  readonly step?: Renderable.Any<number | "any" | null | undefined>;
}

function internalProps<const Options extends SpinButtonOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "number",
      value: RefSubject.map(options.state, (state) => state.value),
      ".value": RefSubject.map(options.state, (state) => String(state.value)),
      min: property("min", undefined),
      max: property("max", undefined),
      step: property("step", undefined),
      onchange: EventHandler.make(
        Effect.fn((event: Event) =>
          setValue(options.state, Dom.currentTarget<HTMLInputElement>(event).valueAsNumber),
        ),
      ),
      ref: options.state,
    }) as const;
}
type SpinButtonInternalProps<Options extends SpinButtonOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a native number input synchronized with hydrated state.
 * @remarks
 * ## Why
 * Browser editing, stepping, validation, and form behavior remain intact while
 * change events update renderer-independent state.
 * ## Ownership and lifetime
 * Running the Fx owns listener/state subscriptions in its Scope. A custom host
 * must preserve type, value, constraints, and the single hydration ref owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as SpinButton from "@typed/ui/SpinButton"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* SpinButton.makeState({ value: 1 })
 *   return SpinButton.SpinButton({ state, min: 0 })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function SpinButton<
  const Options extends SpinButtonOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SpinButtonInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    SpinButtonInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (props) => {
    return html`<input ...${props} />`;
  });
}
