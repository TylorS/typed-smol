import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Three-state value accepted by a checkbox.
 * @remarks
 * ## Why
 * `"mixed"` models the platform's indeterminate presentation without
 * conflating it with either submitted boolean state.
 * ## Ownership and lifetime
 * This pure type acquires no resources.
 * @since 1.0.0
 * @category models
 */
export type Checked = boolean | "mixed";

/** Current renderer-independent checkbox state.
 * @remarks
 * ## Why
 * State can be updated and tested through RefSubject before any input mounts.
 * ## Ownership and lifetime
 * The value is plain data; the hydrated RefSubject returned by `makeState`
 * owns observation for its Effect Scope.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Current checked or mixed value.
   * @remarks
   * ## Why
   * One field drives `checked`, `indeterminate`, and `aria-checked` together.
   * ## Ownership and lifetime
   * Plain state retains no resources.
   * @since 1.0.0
   * @category state
   */
  readonly checked: Checked;
}

/** Initial checkbox state accepted by `makeState`.
 * @remarks
 * ## Why
 * The optional value gives uncontrolled creation a deterministic false default.
 * ## Ownership and lifetime
 * This configuration is inert and retains no resources.
 * @since 1.0.0
 * @category state
 */
export interface InitialState {
  /** Initial checked value; defaults to `false`.
   * @remarks
   * ## Why
   * Explicit mixed state can survive SSR hydration.
   * ## Ownership and lifetime
   * The value is copied into hydrated state and retains no resource.
   * @since 1.0.0
   * @category state
   */
  readonly checked?: Checked;
}

/** Schema used to encode and hydrate checkbox state.
 * @remarks
 * ## Why
 * A shared schema keeps server and client state shape identical.
 * ## Ownership and lifetime
 * The schema is immutable and acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({
  checked: Schema.Literals([true, false, "mixed"]),
});

/** Creates hydrated, renderer-independent checkbox state.
 * @remarks
 * ## Why
 * State transitions remain testable without rendering and can be consumed by
 * any UI producer.
 * ## Ownership and lifetime
 * The caller's Effect Scope owns the hydrated RefSubject and its subscriptions.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Checkbox.makeState({ checked: "mixed" })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

/** Sets the checkbox state to a boolean or mixed value.
 * @remarks
 * ## Why
 * A single atomic RefSubject update keeps DOM properties and ARIA state aligned.
 * ## Ownership and lifetime
 * The Effect uses the existing subject lifetime and acquires no new resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Checkbox.makeState()
 *   yield* Checkbox.setChecked(state, true)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: Checked,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

/** Toggles checked to false and false or mixed to true.
 * @remarks
 * ## Why
 * User activation of an indeterminate checkbox resolves to a concrete checked
 * state, matching native input behavior.
 * ## Ownership and lifetime
 * The Effect updates the existing RefSubject and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Checkbox.makeState({ checked: "mixed" })
 *   yield* Checkbox.toggle(state)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    checked: current.checked === true ? false : true,
  }));
}

/** Options for the native checkbox input.
 * @remarks
 * ## Why
 * The state reference is the single source for native and ARIA checked values.
 * ## Ownership and lifetime
 * Options are inert; the component Scope owns DOM subscriptions and refs.
 * @since 1.0.0
 * @category models
 */
export interface InputOptions extends Dom.HostOptions<HTMLInputElement> {
  /** Hydrated state synchronized with the input.
   * @remarks
   * ## Why
   * Hydration preserves checked identity and enables state-only tests.
   * ## Ownership and lifetime
   * The input borrows the RefSubject; its original Scope remains the owner.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
}

function internalProps<const Options extends InputOptions>(options: Options) {
  const checked = RefSubject.map(options.state, (state) => state.checked === true);
  const indeterminate = RefSubject.map(options.state, (state) => state.checked === "mixed");
  const onChange = EventHandler.make(
    Effect.fn((event: Event) =>
      setChecked(options.state, Dom.currentTarget<HTMLInputElement>(event).checked),
    ),
  );

  return ({ property }: Dom.InternalPropsHelpers<Options>) => ({
    type: "checkbox",
    "aria-checked": RefSubject.map(options.state, (state) => state.checked),
    "?checked": checked,
    ".checked": checked,
    "?disabled": property("disabled", false),
    "?required": property("required", false),
    ".indeterminate": indeterminate,
    onchange: onChange,
    ref: options.state,
  });
}

type InputInternalProps<Options extends InputOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a native checkbox input synchronized with hydrated state.
 * @remarks
 * ## Why
 * Native keyboard, form, disabled, required, and accessibility behavior remain
 * available while state is exposed through RefSubject.
 * ## Ownership and lifetime
 * Running the Fx installs native listeners and state subscriptions in its
 * Scope. A custom host must apply `type`, checked, indeterminate, ARIA, and ref
 * props; only one hydration owner may be composed for the element.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Checkbox from "@typed/ui/Checkbox"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Checkbox.makeState()
 *   return Checkbox.Input({ state })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Input<const Options extends InputOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, InputInternalProps<Options>>, "", Host>,
) {
  return Dom.renderHost<HTMLInputElement>()<
    Options,
    InputInternalProps<Options>,
    "",
    HostResult,
    Host
  >(options, host, internalProps(options), "", (i) => {
    return html`<input ...${i} />`;
  });
}

/** Canonical component alias for `Input`.
 * @remarks
 * ## Why
 * The alias provides the widget name while retaining the explicit input API.
 * ## Ownership and lifetime
 * It has exactly the same Scope and native-element ownership as `Input`.
 * @since 1.0.0
 * @category aliases
 */
export const Checkbox = Input;
