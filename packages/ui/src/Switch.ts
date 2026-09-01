import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { html, type Renderable } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/** Current renderer-independent switch state.
 * @remarks
 * ## Why
 * The boolean can be tested and transformed without mounting a button.
 * ## Ownership and lifetime
 * Plain state retains no resources; its RefSubject owns updates by Scope.
 * @since 1.0.0
 * @category state
 */
export interface State {
  /** Whether the switch is on.
   * @remarks
   * ## Why
   * This value drives the required `aria-checked` state.
   * ## Ownership and lifetime
   * Plain data acquires no resources.
   * @since 1.0.0
   * @category state
   */
  readonly checked: boolean;
}

/** Optional initial switch state.
 * @remarks
 * ## Why
 * Omission provides a deterministic off state for SSR and clients.
 * ## Ownership and lifetime
 * Configuration is inert.
 * @since 1.0.0
 * @category state
 */
export interface InitialState {
  /** Initial on/off value, defaulting to false.
   * @remarks
   * ## Why
   * The value seeds the serializable hydration contract.
   * ## Ownership and lifetime
   * It is copied into state and retains no resource.
   * @since 1.0.0
   * @category state
   */
  readonly checked?: boolean;
}

/** Schema for switch hydration state.
 * @remarks
 * ## Why
 * Shared encoding keeps SSR and browser state compatible.
 * ## Ownership and lifetime
 * The immutable schema acquires no resources.
 * @since 1.0.0
 * @category schemas
 */
export const StateSchema = Schema.Struct({ checked: Schema.Boolean });

/** Creates hydrated switch state independent of rendering.
 * @remarks
 * ## Why
 * Domain code and tests can own the state while any renderer consumes it.
 * ## Ownership and lifetime
 * The caller's Effect Scope owns the returned RefSubject.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   return yield* Switch.makeState({ checked: true })
 * })
 * ```
 * @since 1.0.0
 * @category constructors
 */
export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { checked: initial.checked ?? false });
}

/** Sets the switch on/off state.
 * @remarks
 * ## Why
 * Explicit transitions keep state logic outside the renderer.
 * ## Ownership and lifetime
 * The Effect reuses the subject's lifetime and acquires no resource.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Switch.makeState()
 *   yield* Switch.setChecked(state, true)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function setChecked<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  checked: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked }));
}

/** Atomically inverts the switch state.
 * @remarks
 * ## Why
 * A RefSubject update prevents stale read-then-write transitions.
 * ## Ownership and lifetime
 * The Effect acquires no resource and uses the existing state Scope.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Switch.makeState({ checked: true })
 *   yield* Switch.toggle(state)
 * })
 * ```
 * @since 1.0.0
 * @category state
 */
export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, checked: !current.checked }));
}

/** Options for an ARIA switch rendered as a native button.
 * @remarks
 * ## Why
 * Button behavior supplies focus and keyboard activation while ARIA exposes
 * the binary switch semantic.
 * ## Ownership and lifetime
 * Options are inert; rendering owns subscriptions and listeners by Scope.
 * @since 1.0.0
 * @category models
 */
export interface SwitchOptions extends Dom.HostOptions<HTMLButtonElement> {
  /** Hydrated state synchronized with `aria-checked`.
   * @remarks
   * ## Why
   * One source controls SSR, render output, and activation updates.
   * ## Ownership and lifetime
   * The component borrows the state; its originating Scope owns it.
   * @since 1.0.0
   * @category state
   */
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  /** Visible content and accessible name.
   * @remarks
   * ## Why
   * A switch requires an accessible name, normally supplied by its content.
   * ## Ownership and lifetime
   * Dynamic content follows the component Scope.
   * @since 1.0.0
   * @category content
   */
  readonly content: Renderable.Any;
}

function internalProps<const Options extends SwitchOptions>(options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      type: "button",
      role: "switch",
      "aria-checked": RefSubject.map(options.state, (state) => state.checked),
      "?disabled": property("disabled", false),
      onclick: toggle(options.state),
      ref: options.state,
    }) as const;
}
type SwitchInternalProps<Options extends SwitchOptions> = ReturnType<
  ReturnType<typeof internalProps<Options>>
>;

/** Renders a button-backed ARIA switch.
 * @remarks
 * ## Why
 * The component combines native button activation with a renderer-independent
 * boolean state and real DOM click events.
 * ## Ownership and lifetime
 * Running the Fx owns listener/state subscriptions in its Effect Scope. A
 * custom host must preserve button type, role, `aria-checked`, click handler,
 * and the single hydration ref owner.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Switch from "@typed/ui/Switch"
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* Switch.makeState()
 *   return Switch.Switch({ state, content: "Notifications" })
 * })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Switch<const Options extends SwitchOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SwitchInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SwitchInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, internalProps(options), options.content, (props, content) => {
    return html`<button ...${props}>${content}</button>`;
  });
}
